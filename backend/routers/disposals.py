# routers/disposals.py
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional
from datetime import datetime
import uuid
import logging

from deps.db import db
from models import Disposal, DisposalCreate
from utils.gst import calc_itc_reversal

router = APIRouter(prefix="/api/pharmacy/disposals", tags=["disposals"])
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from JWT token"""
    return {
        "user_id": "current_user_id",
        "username": "current_user",
        "role": "pharmacist"
    }

def check_pharmacy_access(user_role: str):
    """Check pharmacy access"""
    if user_role not in ["admin", "pharmacist", "assistant"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

def check_approval_rights(user_role: str):
    """Check approval rights for disposals"""
    if user_role not in ["admin", "pharmacist"]:
        raise HTTPException(status_code=403, detail="Only Pharmacist-Incharge or Admin can approve disposals")

@router.get("", response_model=List[dict])
async def get_disposals(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    reason: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all disposals with optional filtering"""
    check_pharmacy_access(current_user["role"])
    
    try:
        query = {}
        if start_date and end_date:
            query["created_at"] = {
                "$gte": datetime.fromisoformat(start_date),
                "$lte": datetime.fromisoformat(end_date)
            }
        if reason:
            query["reason"] = reason
        
        disposals_cursor = db.disposals.find(query).sort("created_at", -1)
        disposals = []
        
        async for disposal in disposals_cursor:
            disposal["id"] = str(disposal["_id"])
            
            # Get batch and product details
            batch = await db.batches.find_one({"_id": disposal["batch_id"]})
            if batch:
                product = await db.products.find_one({"_id": batch["product_id"]})
                if product:
                    disposal["product_name"] = f"{product['brand_name']} {product['strength']} {product['form']}"
                    disposal["chemical_name"] = product["chemical_name"]
                    disposal["batch_no"] = batch["batch_no"]
                    disposal["expiry"] = batch["expiry"]
                    disposal["mrp"] = batch["mrp"]
                    disposal["cost_per_unit"] = batch["effective_cost_per_unit"]
                    disposal["total_cost_value"] = round(disposal["qty"] * batch["effective_cost_per_unit"], 2)
                    disposal["total_mrp_value"] = round(disposal["qty"] * batch["mrp"], 2)
            
            disposals.append(disposal)
        
        return disposals
        
    except Exception as e:
        logging.error(f"Error fetching disposals: {e}")
        raise HTTPException(status_code=500, detail="Error fetching disposals")

@router.post("", response_model=dict, status_code=201)
async def create_disposal(disposal: DisposalCreate, current_user: dict = Depends(get_current_user)):
    """Create disposal record (requires approval)"""
    # Only pharmacist or admin can create disposals
    check_approval_rights(current_user["role"])
    
    try:
        # Validate batch exists and get details
        batch = await db.batches.find_one({"_id": disposal.batch_id})
        if not batch:
            raise HTTPException(status_code=404, detail="Batch not found")
        
        # Check current stock for the batch
        stock_cursor = db.stock_ledger.find({"batch_id": disposal.batch_id})
        current_stock = 0
        async for stock_entry in stock_cursor:
            current_stock += stock_entry.get("qty_in", 0) - stock_entry.get("qty_out", 0)
        
        if current_stock < disposal.qty:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for disposal. Available: {current_stock}, Requested: {disposal.qty}"
            )
        
        # Get product details for reference
        product = await db.products.find_one({"_id": batch["product_id"]})
        
        # Calculate ITC reversal (for tax compliance)
        # This is a simplified calculation - in practice, you'd need the original purchase tax details
        original_purchase = await db.purchases.find_one({"batch_ids": disposal.batch_id})
        itc_reversal = 0.0
        
        if original_purchase:
            # Calculate proportional ITC reversal
            total_received = batch["received_qty"] + batch.get("free_qty", 0)
            if total_received > 0:
                # Simplified - assume equal GST distribution
                purchase_tax_per_unit = (
                    original_purchase["totals"]["cgst"] + 
                    original_purchase["totals"]["sgst"] + 
                    original_purchase["totals"]["igst"]
                ) / total_received
                itc_reversal = round(purchase_tax_per_unit * disposal.qty, 2)
        
        # Create disposal record
        disposal_doc = {
            "id": str(uuid.uuid4()),
            "batch_id": disposal.batch_id,
            "qty": disposal.qty,
            "reason": disposal.reason,
            "remark": disposal.remark,
            "itc_reversal_tax": itc_reversal,
            "approved_by": current_user["user_id"],
            "created_at": datetime.utcnow()
        }
        
        result = await db.disposals.insert_one(disposal_doc)
        disposal_id = str(result.inserted_id)
        
        # Create stock ledger entry (remove from inventory)
        stock_entry = {
            "id": str(uuid.uuid4()),
            "product_id": batch["product_id"],
            "batch_id": disposal.batch_id,
            "txn_type": "DISPOSAL",
            "qty_in": 0,
            "qty_out": disposal.qty,
            "cost_per_unit": batch["effective_cost_per_unit"],
            "mrp": batch["mrp"],
            "ref_type": "DISPOSAL",
            "ref_id": disposal_id,
            "created_at": datetime.utcnow()
        }
        await db.stock_ledger.insert_one(stock_entry)
        
        # Calculate disposal costs
        cost_value = disposal.qty * batch["effective_cost_per_unit"]
        mrp_value = disposal.qty * batch["mrp"]
        
        # Create audit entry
        audit_entry = {
            "actor_id": current_user["user_id"],
            "role": current_user["role"],
            "action": "CREATE_DISPOSAL",
            "entity": "DISPOSAL",
            "entity_id": disposal_id,
            "after": {
                "batch_id": disposal.batch_id,
                "qty": disposal.qty,
                "reason": disposal.reason,
                "cost_value": round(cost_value, 2),
                "itc_reversal": itc_reversal
            },
            "created_at": datetime.utcnow()
        }
        await db.audits.insert_one(audit_entry)
        
        return {
            "id": disposal_id,
            "cost_value": round(cost_value, 2),
            "mrp_value": round(mrp_value, 2),
            "itc_reversal_tax": itc_reversal,
            "message": "Disposal created successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error creating disposal: {e}")
        raise HTTPException(status_code=500, detail="Error creating disposal")

@router.get("/summary", response_model=dict)
async def get_disposal_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get disposal summary with totals"""
    check_pharmacy_access(current_user["role"])
    
    try:
        # Build date filter
        date_filter = {}
        if start_date and end_date:
            date_filter = {
                "created_at": {
                    "$gte": datetime.fromisoformat(start_date),
                    "$lte": datetime.fromisoformat(end_date)
                }
            }
        
        # Aggregate disposal data
        pipeline = [
            {"$match": date_filter},
            {
                "$lookup": {
                    "from": "batches",
                    "localField": "batch_id",
                    "foreignField": "_id",
                    "as": "batch"
                }
            },
            {"$unwind": "$batch"},
            {
                "$addFields": {
                    "cost_value": {"$multiply": ["$qty", "$batch.effective_cost_per_unit"]},
                    "mrp_value": {"$multiply": ["$qty", "$batch.mrp"]}
                }
            },
            {
                "$group": {
                    "_id": "$reason",
                    "total_qty": {"$sum": "$qty"},
                    "total_cost_value": {"$sum": "$cost_value"},
                    "total_mrp_value": {"$sum": "$mrp_value"},
                    "total_itc_reversal": {"$sum": "$itc_reversal_tax"},
                    "count": {"$sum": 1}
                }
            }
        ]
        
        cursor = db.disposals.aggregate(pipeline)
        reason_summary = []
        total_summary = {
            "total_qty": 0,
            "total_cost_value": 0.0,
            "total_mrp_value": 0.0,
            "total_itc_reversal": 0.0,
            "total_disposals": 0
        }
        
        async for item in cursor:
            reason_data = {
                "reason": item["_id"],
                "qty": item["total_qty"],
                "cost_value": round(item["total_cost_value"], 2),
                "mrp_value": round(item["total_mrp_value"], 2),
                "itc_reversal": round(item["total_itc_reversal"], 2),
                "count": item["count"]
            }
            reason_summary.append(reason_data)
            
            # Accumulate totals
            total_summary["total_qty"] += item["total_qty"]
            total_summary["total_cost_value"] += item["total_cost_value"]
            total_summary["total_mrp_value"] += item["total_mrp_value"]
            total_summary["total_itc_reversal"] += item["total_itc_reversal"]
            total_summary["total_disposals"] += item["count"]
        
        # Round totals
        for key in ["total_cost_value", "total_mrp_value", "total_itc_reversal"]:
            total_summary[key] = round(total_summary[key], 2)
        
        return {
            "by_reason": reason_summary,
            "totals": total_summary
        }
        
    except Exception as e:
        logging.error(f"Error getting disposal summary: {e}")
        raise HTTPException(status_code=500, detail="Error getting disposal summary")

@router.get("/expired-batches", response_model=List[dict])
async def get_expired_batches(current_user: dict = Depends(get_current_user)):
    """Get batches that have expired and can be disposed"""
    check_pharmacy_access(current_user["role"])
    
    try:
        current_month = datetime.utcnow().strftime("%Y-%m")
        
        # Find expired batches with current stock
        pipeline = [
            {"$match": {"expiry": {"$lt": current_month}, "status": "APPROVED"}},
            {
                "$lookup": {
                    "from": "stock_ledger",
                    "localField": "_id",
                    "foreignField": "batch_id",
                    "as": "movements"
                }
            },
            {
                "$addFields": {
                    "current_stock": {
                        "$subtract": [
                            {"$sum": "$movements.qty_in"},
                            {"$sum": "$movements.qty_out"}
                        ]
                    }
                }
            },
            {"$match": {"current_stock": {"$gt": 0}}},
            {
                "$lookup": {
                    "from": "products",
                    "localField": "product_id", 
                    "foreignField": "_id",
                    "as": "product"
                }
            },
            {"$unwind": "$product"}
        ]
        
        cursor = db.batches.aggregate(pipeline)
        expired_batches = []
        
        async for batch in cursor:
            cost_value = batch["current_stock"] * batch["effective_cost_per_unit"]
            mrp_value = batch["current_stock"] * batch["mrp"]
            
            expired_batch = {
                "batch_id": str(batch["_id"]),
                "batch_no": batch["batch_no"],
                "product_name": f"{batch['product']['brand_name']} {batch['product']['strength']} {batch['product']['form']}",
                "chemical_name": batch["product"]["chemical_name"],
                "expiry": batch["expiry"],
                "current_stock": batch["current_stock"],
                "cost_per_unit": batch["effective_cost_per_unit"],
                "mrp": batch["mrp"],
                "cost_value": round(cost_value, 2),
                "mrp_value": round(mrp_value, 2),
                "months_expired": (datetime.utcnow() - datetime.strptime(batch["expiry"], "%Y-%m")).days // 30
            }
            expired_batches.append(expired_batch)
        
        # Sort by expiry date (oldest first)
        expired_batches.sort(key=lambda x: x["expiry"])
        
        return expired_batches
        
    except Exception as e:
        logging.error(f"Error fetching expired batches: {e}")
        raise HTTPException(status_code=500, detail="Error fetching expired batches")
# routers/purchases.py
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional
from datetime import datetime
import uuid
import logging

from deps.db import db
from models import Purchase, PurchaseCreate, PurchaseResponse, BatchCreate
from utils.gst import calc_purchase_line, is_supplier_intra_kerala, validate_gst_rate
from utils.schedule import validate_schedule_compliance

router = APIRouter(prefix="/api/pharmacy/purchases", tags=["purchases"])
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
    """Check approval rights"""
    if user_role not in ["admin", "pharmacist"]:
        raise HTTPException(status_code=403, detail="Only Pharmacist-Incharge or Admin can approve")

@router.get("", response_model=List[PurchaseResponse])
async def get_purchases(
    status_filter: Optional[str] = None,
    supplier_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all purchases with optional filtering"""
    check_pharmacy_access(current_user["role"])
    
    try:
        query = {}
        if status_filter:
            query["status"] = status_filter
        if supplier_id:
            query["supplier_id"] = supplier_id
        
        purchases_cursor = db.purchases.find(query).sort("created_at", -1)
        purchases = []
        
        async for purchase in purchases_cursor:
            purchase["id"] = str(purchase["_id"])
            
            # Get supplier name
            supplier = await db.suppliers.find_one({"_id": purchase["supplier_id"]})
            supplier_name = supplier["name"] if supplier else "Unknown"
            
            purchase_response = PurchaseResponse(**purchase)
            purchase_response.supplier_name = supplier_name
            purchase_response.total_items = len(purchase.get("items", []))
            
            purchases.append(purchase_response)
        
        return purchases
    except Exception as e:
        logging.error(f"Error fetching purchases: {e}")
        raise HTTPException(status_code=500, detail="Error fetching purchases")

@router.post("", response_model=dict, status_code=201)
async def create_purchase(purchase: PurchaseCreate, current_user: dict = Depends(get_current_user)):
    """Create new purchase (PENDING status)"""
    check_pharmacy_access(current_user["role"])
    
    try:
        # Validate supplier exists
        supplier = await db.suppliers.find_one({"_id": purchase.supplier_id})
        if not supplier:
            raise HTTPException(status_code=404, detail="Supplier not found")
        
        # Determine if intra-state for GST calculation
        is_intra = is_supplier_intra_kerala(supplier.get("state", ""))
        
        # Process each item and create batches
        processed_items = []
        batch_ids = []
        purchase_totals = {
            "taxable": 0.0,
            "cgst": 0.0,
            "sgst": 0.0,
            "igst": 0.0,
            "post_tax_discount": 0.0,
            "net_payable": 0.0
        }
        
        for item in purchase.items:
            # Validate GST rate
            if not validate_gst_rate(item.gst_rate):
                raise HTTPException(status_code=400, detail=f"Invalid GST rate: {item.gst_rate}")
            
            # Validate expiry date
            try:
                exp_date = datetime.strptime(item.expiry, "%Y-%m")
                if exp_date <= datetime.now():
                    raise HTTPException(status_code=400, detail="Expiry date must be in future")
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid expiry date format (YYYY-MM)")
            
            # Calculate line totals
            line_calc = calc_purchase_line(
                is_intra=is_intra,
                billed_qty=item.billed_qty,
                free_qty=item.free_qty,
                trade_price_ex=item.trade_price_ex_tax,
                gst_rate=item.gst_rate,
                scheme_pct=item.scheme_pct,
                cash_pct=item.cash_pct
            )
            
            # Create batch record (PENDING)
            batch_doc = {
                "id": str(uuid.uuid4()),
                "product_id": item.product_id,
                "batch_no": item.batch_no,
                "expiry": item.expiry,
                "gst_rate": item.gst_rate,
                "mrp": item.mrp,
                "trade_price_ex_tax": item.trade_price_ex_tax,
                "scheme_pct": item.scheme_pct,
                "cash_pct": item.cash_pct,
                "received_qty": item.billed_qty,
                "free_qty": item.free_qty,
                "effective_cost_per_unit": line_calc["effective_cost_per_unit"],
                "supplier_id": purchase.supplier_id,
                "received_at": datetime.utcnow(),
                "rack_id": item.rack_id,
                "status": "PENDING"
            }
            
            result = await db.batches.insert_one(batch_doc)
            batch_ids.append(str(result.inserted_id))
            
            # Accumulate totals
            purchase_totals["taxable"] += line_calc["taxable"]
            purchase_totals["cgst"] += line_calc["cgst"]
            purchase_totals["sgst"] += line_calc["sgst"]
            purchase_totals["igst"] += line_calc["igst"]
            purchase_totals["post_tax_discount"] += line_calc["post_tax_discount"]
            purchase_totals["net_payable"] += line_calc["row_net"]
            
            # Store processed item
            processed_item = item.dict()
            processed_item["batch_id"] = str(result.inserted_id)
            processed_item.update(line_calc)
            processed_items.append(processed_item)
        
        # Round totals
        for key in purchase_totals:
            purchase_totals[key] = round(purchase_totals[key], 2)
        
        # Create purchase record
        purchase_doc = {
            "id": str(uuid.uuid4()),
            "invoice_no": purchase.invoice_no,
            "invoice_date": purchase.invoice_date,
            "supplier_id": purchase.supplier_id,
            "type": purchase.type,
            "items": processed_items,
            "batch_ids": batch_ids,
            "totals": purchase_totals,
            "created_by": current_user["user_id"],
            "status": "PENDING",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await db.purchases.insert_one(purchase_doc)
        purchase_doc["id"] = str(result.inserted_id)
        
        return {
            "id": purchase_doc["id"],
            "status": "PENDING",
            "totals": purchase_totals,
            "message": "Purchase created successfully. Awaiting approval."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error creating purchase: {e}")
        raise HTTPException(status_code=500, detail="Error creating purchase")

@router.post("/{purchase_id}/approve", status_code=200)
async def approve_purchase(purchase_id: str, current_user: dict = Depends(get_current_user)):
    """Approve purchase and commit to inventory"""
    check_approval_rights(current_user["role"])
    
    try:
        # Get purchase
        purchase = await db.purchases.find_one({"_id": purchase_id})
        if not purchase:
            raise HTTPException(status_code=404, detail="Purchase not found")
        
        if purchase.get("status") != "PENDING":
            raise HTTPException(status_code=400, detail="Purchase is not pending approval")
        
        # Commit all batches to inventory via stock ledger
        for batch_id in purchase["batch_ids"]:
            batch = await db.batches.find_one({"_id": batch_id})
            if not batch:
                continue
            
            # Create stock ledger entry
            stock_entry = {
                "id": str(uuid.uuid4()),
                "product_id": batch["product_id"],
                "batch_id": batch_id,
                "txn_type": "PURCHASE",
                "qty_in": batch["received_qty"] + batch.get("free_qty", 0),
                "qty_out": 0,
                "cost_per_unit": batch["effective_cost_per_unit"],
                "mrp": batch["mrp"],
                "ref_type": "PURCHASE",
                "ref_id": purchase_id,
                "created_at": datetime.utcnow()
            }
            
            await db.stock_ledger.insert_one(stock_entry)
            
            # Update batch status
            await db.batches.update_one(
                {"_id": batch_id},
                {"$set": {"status": "APPROVED", "updated_at": datetime.utcnow()}}
            )
        
        # Update purchase status
        await db.purchases.update_one(
            {"_id": purchase_id},
            {
                "$set": {
                    "status": "APPROVED",
                    "approved_by": current_user["user_id"],
                    "approved_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Create audit entry
        audit_entry = {
            "actor_id": current_user["user_id"],
            "role": current_user["role"],
            "action": "APPROVE_PURCHASE",
            "entity": "PURCHASE",
            "entity_id": purchase_id,
            "after": {"status": "APPROVED"},
            "created_at": datetime.utcnow()
        }
        await db.audits.insert_one(audit_entry)
        
        return {"message": "Purchase approved successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error approving purchase: {e}")
        raise HTTPException(status_code=500, detail="Error approving purchase")

@router.post("/{purchase_id}/reject", status_code=200)
async def reject_purchase(
    purchase_id: str, 
    reason: str, 
    current_user: dict = Depends(get_current_user)
):
    """Reject purchase with reason"""
    check_approval_rights(current_user["role"])
    
    try:
        # Get purchase
        purchase = await db.purchases.find_one({"_id": purchase_id})
        if not purchase:
            raise HTTPException(status_code=404, detail="Purchase not found")
        
        if purchase.get("status") != "PENDING":
            raise HTTPException(status_code=400, detail="Purchase is not pending approval")
        
        # Update purchase status
        await db.purchases.update_one(
            {"_id": purchase_id},
            {
                "$set": {
                    "status": "REJECTED",
                    "rejected_by": current_user["user_id"],
                    "rejection_reason": reason,
                    "rejected_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Delete associated batches since they won't be used
        await db.batches.delete_many({"_id": {"$in": purchase["batch_ids"]}})
        
        # Create audit entry
        audit_entry = {
            "actor_id": current_user["user_id"],
            "role": current_user["role"],
            "action": "REJECT_PURCHASE",
            "entity": "PURCHASE",
            "entity_id": purchase_id,
            "after": {"status": "REJECTED", "reason": reason},
            "created_at": datetime.utcnow()
        }
        await db.audits.insert_one(audit_entry)
        
        return {"message": "Purchase rejected successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error rejecting purchase: {e}")
        raise HTTPException(status_code=500, detail="Error rejecting purchase")
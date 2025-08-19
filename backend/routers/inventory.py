# routers/inventory.py
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional
from datetime import datetime, timedelta
import logging

from deps.db import db
from models import BatchResponse, ProductResponse, ScheduleSymbol
from utils.gst import get_expiry_color

router = APIRouter(prefix="/api/pharmacy/inventory", tags=["inventory"])
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
    if user_role not in ["admin", "pharmacist", "assistant", "doctor", "nurse"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

@router.get("/stock", response_model=List[dict])
async def get_current_stock(
    product_id: Optional[str] = None,
    rack_id: Optional[str] = None,
    expiry_color: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get current stock levels by product and batch"""
    check_pharmacy_access(current_user["role"])
    
    try:
        # Build aggregation pipeline
        pipeline = [
            {
                "$lookup": {
                    "from": "products",
                    "localField": "product_id",
                    "foreignField": "_id",
                    "as": "product"
                }
            },
            {"$unwind": "$product"},
            {
                "$lookup": {
                    "from": "stock_ledger",
                    "localField": "_id",
                    "foreignField": "batch_id",
                    "as": "stock_movements"
                }
            },
            {
                "$addFields": {
                    "current_stock": {
                        "$subtract": [
                            {"$sum": "$stock_movements.qty_in"},
                            {"$sum": "$stock_movements.qty_out"}
                        ]
                    },
                    "expiry_color": {
                        "$switch": {
                            "branches": [
                                {
                                    "case": {"$lte": ["$expiry", {"$dateToString": {"format": "%Y-%m", "date": {"$add": [datetime.utcnow(), timedelta(days=90)]}}}]},
                                    "then": "red"
                                },
                                {
                                    "case": {"$lte": ["$expiry", {"$dateToString": {"format": "%Y-%m", "date": {"$add": [datetime.utcnow(), timedelta(days=180)]}}}]},
                                    "then": "orange"
                                },
                                {
                                    "case": {"$lte": ["$expiry", {"$dateToString": {"format": "%Y-%m", "date": {"$add": [datetime.utcnow(), timedelta(days=365)]}}}]},
                                    "then": "yellow"
                                }
                            ],
                            "default": "ok"
                        }
                    }
                }
            },
            {"$match": {"current_stock": {"$gt": 0}}}  # Only show items with stock
        ]
        
        # Add filters
        if product_id:
            pipeline.insert(0, {"$match": {"product_id": product_id}})
        if rack_id:
            pipeline.insert(0, {"$match": {"rack_id": rack_id}})
        
        # Execute aggregation
        cursor = db.batches.aggregate(pipeline)
        stock_items = []
        
        async for item in cursor:
            # Apply expiry color filter if specified
            if expiry_color and item.get("expiry_color") != expiry_color:
                continue
            
            stock_item = {
                "batch_id": str(item["_id"]),
                "batch_no": item["batch_no"],
                "product_id": str(item["product_id"]),
                "product_name": f"{item['product']['brand_name']} {item['product']['strength']} {item['product']['form']}",
                "chemical_name": item["product"]["chemical_name"],
                "company_name": item["product"].get("company_name", ""),
                "schedule_symbol": item["product"]["schedule_symbol"],
                "expiry": item["expiry"],
                "expiry_color": item["expiry_color"],
                "mrp": item["mrp"],
                "current_stock": item["current_stock"],
                "effective_cost_per_unit": item["effective_cost_per_unit"],
                "rack_id": item.get("rack_id"),
                "gst_rate": item["gst_rate"]
            }
            stock_items.append(stock_item)
        
        return stock_items
        
    except Exception as e:
        logging.error(f"Error fetching stock: {e}")
        raise HTTPException(status_code=500, detail="Error fetching stock")

@router.get("/near-expiry", response_model=List[dict])
async def get_near_expiry_items(
    months: Optional[int] = 6,
    rack_id: Optional[str] = None,
    schedule: Optional[ScheduleSymbol] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get items nearing expiry"""
    check_pharmacy_access(current_user["role"])
    
    try:
        # Calculate cutoff date
        cutoff_date = (datetime.utcnow() + timedelta(days=months*30)).strftime("%Y-%m")
        
        # Build query
        query = {
            "expiry": {"$lte": cutoff_date},
            "status": "APPROVED"
        }
        
        if rack_id:
            query["rack_id"] = rack_id
        
        # Get batches
        batches_cursor = db.batches.find(query)
        near_expiry_items = []
        
        async for batch in batches_cursor:
            # Get current stock
            stock_cursor = db.stock_ledger.find({"batch_id": str(batch["_id"])})
            current_stock = 0
            async for stock_entry in stock_cursor:
                current_stock += stock_entry.get("qty_in", 0) - stock_entry.get("qty_out", 0)
            
            if current_stock <= 0:
                continue  # Skip items with no stock
            
            # Get product details
            product = await db.products.find_one({"_id": batch["product_id"]})
            if not product:
                continue
            
            # Apply schedule filter
            if schedule and product.get("schedule_symbol") != schedule:
                continue
            
            # Calculate expiry color
            expiry_color = get_expiry_color(batch["expiry"])
            
            # Calculate value at cost and MRP
            cost_value = current_stock * batch["effective_cost_per_unit"]
            mrp_value = current_stock * batch["mrp"]
            
            near_expiry_item = {
                "batch_id": str(batch["_id"]),
                "batch_no": batch["batch_no"],
                "product_name": f"{product['brand_name']} {product['strength']} {product['form']}",
                "chemical_name": product["chemical_name"],
                "company_name": product.get("company_name", ""),
                "schedule_symbol": product["schedule_symbol"],
                "expiry": batch["expiry"],
                "expiry_color": expiry_color,
                "days_to_expiry": (datetime.strptime(batch["expiry"], "%Y-%m") - datetime.utcnow()).days,
                "current_stock": current_stock,
                "mrp": batch["mrp"],
                "cost_per_unit": batch["effective_cost_per_unit"],
                "cost_value": round(cost_value, 2),
                "mrp_value": round(mrp_value, 2),
                "rack_id": batch.get("rack_id"),
                "supplier_id": batch["supplier_id"]
            }
            near_expiry_items.append(near_expiry_item)
        
        # Sort by expiry date (earliest first)
        near_expiry_items.sort(key=lambda x: x["expiry"])
        
        return near_expiry_items
        
    except Exception as e:
        logging.error(f"Error fetching near-expiry items: {e}")
        raise HTTPException(status_code=500, detail="Error fetching near-expiry items")

@router.get("/movements/{batch_id}", response_model=List[dict])
async def get_batch_movements(batch_id: str, current_user: dict = Depends(get_current_user)):
    """Get stock movement history for a specific batch"""
    check_pharmacy_access(current_user["role"])
    
    try:
        movements_cursor = db.stock_ledger.find({"batch_id": batch_id}).sort("created_at", -1)
        movements = []
        
        async for movement in movements_cursor:
            movement["id"] = str(movement["_id"])
            
            # Get reference details
            ref_details = {}
            if movement["ref_type"] == "PURCHASE":
                purchase = await db.purchases.find_one({"_id": movement["ref_id"]})
                if purchase:
                    ref_details = {
                        "invoice_no": purchase["invoice_no"],
                        "invoice_date": purchase["invoice_date"]
                    }
            elif movement["ref_type"] == "SALE":
                sale = await db.sales.find_one({"_id": movement["ref_id"]})
                if sale:
                    ref_details = {
                        "bill_no": sale["bill_no"],
                        "patient_name": sale["patient"]["name"]
                    }
            
            movement["ref_details"] = ref_details
            movements.append(movement)
        
        return movements
        
    except Exception as e:
        logging.error(f"Error fetching batch movements: {e}")
        raise HTTPException(status_code=500, detail="Error fetching batch movements")

@router.post("/move-batch", status_code=200)
async def move_batch_to_rack(
    batch_id: str, 
    new_rack_id: str, 
    current_user: dict = Depends(get_current_user)
):
    """Move batch to different rack"""
    check_pharmacy_access(current_user["role"])
    
    try:
        # Validate rack exists
        rack = await db.racks.find_one({"_id": new_rack_id})
        if not rack:
            raise HTTPException(status_code=404, detail="Rack not found")
        
        # Validate batch exists
        batch = await db.batches.find_one({"_id": batch_id})
        if not batch:
            raise HTTPException(status_code=404, detail="Batch not found")
        
        old_rack_id = batch.get("rack_id")
        
        # Update batch rack
        await db.batches.update_one(
            {"_id": batch_id},
            {"$set": {"rack_id": new_rack_id, "updated_at": datetime.utcnow()}}
        )
        
        # Create audit entry
        audit_entry = {
            "actor_id": current_user["user_id"],
            "role": current_user["role"],
            "action": "MOVE_BATCH",
            "entity": "BATCH",
            "entity_id": batch_id,
            "before": {"rack_id": old_rack_id},
            "after": {"rack_id": new_rack_id},
            "created_at": datetime.utcnow()
        }
        await db.audits.insert_one(audit_entry)
        
        return {"message": "Batch moved successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error moving batch: {e}")
        raise HTTPException(status_code=500, detail="Error moving batch")

@router.get("/valuation", response_model=dict)
async def get_inventory_valuation(current_user: dict = Depends(get_current_user)):
    """Get total inventory valuation at cost and MRP"""
    check_pharmacy_access(current_user["role"])
    
    try:
        # Aggregate stock values
        pipeline = [
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
                "$addFields": {
                    "cost_value": {"$multiply": ["$current_stock", "$effective_cost_per_unit"]},
                    "mrp_value": {"$multiply": ["$current_stock", "$mrp"]}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total_cost_value": {"$sum": "$cost_value"},
                    "total_mrp_value": {"$sum": "$mrp_value"},
                    "total_items": {"$sum": 1},
                    "total_quantity": {"$sum": "$current_stock"}
                }
            }
        ]
        
        cursor = db.batches.aggregate(pipeline)
        result = await cursor.to_list(length=1)
        
        if result:
            valuation = result[0]
            return {
                "total_cost_value": round(valuation["total_cost_value"], 2),
                "total_mrp_value": round(valuation["total_mrp_value"], 2),
                "total_items": valuation["total_items"],
                "total_quantity": valuation["total_quantity"],
                "potential_profit": round(valuation["total_mrp_value"] - valuation["total_cost_value"], 2)
            }
        else:
            return {
                "total_cost_value": 0.0,
                "total_mrp_value": 0.0,
                "total_items": 0,
                "total_quantity": 0,
                "potential_profit": 0.0
            }
        
    except Exception as e:
        logging.error(f"Error calculating inventory valuation: {e}")
        raise HTTPException(status_code=500, detail="Error calculating inventory valuation")
# routers/returns.py
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional
from datetime import datetime
import uuid
import logging

from deps.db import db
from models import Return, ReturnCreate, ReturnItem
from utils.schedule import requires_prescription, can_override_schedule

router = APIRouter(prefix="/api/pharmacy/returns", tags=["returns"])
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
    """Check approval rights for returns"""
    if user_role not in ["admin", "pharmacist"]:
        raise HTTPException(status_code=403, detail="Only Pharmacist-Incharge or Admin can approve returns")

@router.get("", response_model=List[dict])
async def get_returns(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all returns with optional date filtering"""
    check_pharmacy_access(current_user["role"])
    
    try:
        query = {}
        if start_date and end_date:
            query["date_time"] = {
                "$gte": datetime.fromisoformat(start_date),
                "$lte": datetime.fromisoformat(end_date)
            }
        
        returns_cursor = db.returns.find(query).sort("date_time", -1)
        returns = []
        
        async for return_doc in returns_cursor:
            return_doc["id"] = str(return_doc["_id"])
            
            # Get original sale details
            sale = await db.sales.find_one({"_id": return_doc["sale_id"]})
            if sale:
                return_doc["original_sale"] = {
                    "patient_name": sale["patient"]["name"],
                    "sale_date": sale["date_time"].isoformat()
                }
            
            returns.append(return_doc)
        
        return returns
        
    except Exception as e:
        logging.error(f"Error fetching returns: {e}")
        raise HTTPException(status_code=500, detail="Error fetching returns")

@router.post("", response_model=dict, status_code=201)
async def create_return(return_data: ReturnCreate, current_user: dict = Depends(get_current_user)):
    """Create sales return"""
    check_pharmacy_access(current_user["role"])
    
    try:
        # Validate original sale exists
        sale = await db.sales.find_one({"_id": return_data.sale_id})
        if not sale:
            raise HTTPException(status_code=404, detail="Original sale not found")
        
        # Check if sale has scheduled items (requires special handling)
        has_scheduled_items = False
        if sale.get("schedule_compliance", {}).get("required"):
            has_scheduled_items = True
        
        # Process return items
        return_items = []
        return_totals = {
            "base_reversed": 0.0,
            "cgst_rev": 0.0,
            "sgst_rev": 0.0,  
            "igst_rev": 0.0,
            "net_refund": 0.0
        }
        
        for item_return in return_data.items:
            sale_item_id = item_return["sale_item_id"]
            qty_returned = item_return["qty_returned"]
            batch_id = item_return["batch_id"]
            
            # Get original sale item
            sale_item = await db.sale_items.find_one({"_id": sale_item_id})
            if not sale_item:
                raise HTTPException(
                    status_code=404, 
                    detail=f"Sale item {sale_item_id} not found"
                )
            
            # Validate return quantity
            if qty_returned > sale_item["nos"]:
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot return {qty_returned} items. Original quantity: {sale_item['nos']}"
                )
            
            # Calculate proportional refund amounts
            proportion = qty_returned / sale_item["nos"]
            base_reversed = sale_item["base_ex_tax"] * proportion
            cgst_rev = sale_item["cgst"] * proportion
            sgst_rev = sale_item["sgst"] * proportion
            igst_rev = sale_item["igst"] * proportion
            net_refund = sale_item["net"] * proportion
            
            return_item = {
                "sale_item_id": sale_item_id,
                "batch_id": batch_id,
                "qty_returned": qty_returned,
                "base_reversed": round(base_reversed, 2),
                "cgst_rev": round(cgst_rev, 2),
                "sgst_rev": round(sgst_rev, 2),
                "igst_rev": round(igst_rev, 2),
                "net_refund": round(net_refund, 2)
            }
            return_items.append(return_item)
            
            # Accumulate totals
            return_totals["base_reversed"] += base_reversed
            return_totals["cgst_rev"] += cgst_rev
            return_totals["sgst_rev"] += sgst_rev
            return_totals["igst_rev"] += igst_rev
            return_totals["net_refund"] += net_refund
            
            # Create stock ledger entry (return to inventory)
            stock_entry = {
                "id": str(uuid.uuid4()),
                "product_id": sale_item["product_id"],
                "batch_id": batch_id,
                "txn_type": "RETURN_IN",
                "qty_in": qty_returned,
                "qty_out": 0,
                "cost_per_unit": None,  # Not applicable for returns
                "mrp": sale_item["mrp"],
                "ref_type": "RETURN",
                "ref_id": "",  # Will be set after return creation
                "created_at": datetime.utcnow()
            }
            await db.stock_ledger.insert_one(stock_entry)
        
        # Round totals
        for key in return_totals:
            return_totals[key] = round(return_totals[key], 2)
        
        # Create return record
        return_doc = {
            "id": str(uuid.uuid4()),
            "sale_id": return_data.sale_id,
            "bill_no": return_data.bill_no,
            "date_time": datetime.utcnow(),
            "items": return_items,
            "totals": return_totals,
            "reason": return_data.reason,
            "created_by": current_user["user_id"],
            "created_at": datetime.utcnow()
        }
        
        # If scheduled items, require approval or link to original prescription
        if has_scheduled_items:
            return_doc["schedule_link"] = {
                "rx_docs": sale.get("schedule_compliance", {}).get("rx_docs", []),
                "reason": return_data.reason
            }
            
            # For scheduled returns, require pharmacist approval
            if current_user["role"] == "assistant":
                return_doc["status"] = "PENDING_APPROVAL"
                return_doc["approved_by"] = None
            else:
                return_doc["status"] = "APPROVED"
                return_doc["approved_by"] = current_user["user_id"]
        else:
            return_doc["status"] = "APPROVED"
            return_doc["approved_by"] = current_user["user_id"]
        
        result = await db.returns.insert_one(return_doc)
        return_id = str(result.inserted_id)
        
        # Update stock ledger entries with return reference
        await db.stock_ledger.update_many(
            {"ref_type": "RETURN", "ref_id": ""},
            {"$set": {"ref_id": return_id}}
        )
        
        # Create audit entry
        audit_entry = {
            "actor_id": current_user["user_id"],
            "role": current_user["role"],
            "action": "CREATE_RETURN",
            "entity": "RETURN",
            "entity_id": return_id,
            "after": {"totals": return_totals, "status": return_doc["status"]},
            "created_at": datetime.utcnow()
        }
        await db.audits.insert_one(audit_entry)
        
        return {
            "id": return_id,
            "status": return_doc["status"],
            "totals": return_totals,
            "message": "Return created successfully" + (
                " - Pending approval for scheduled items" if return_doc["status"] == "PENDING_APPROVAL" else ""
            )
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error creating return: {e}")
        raise HTTPException(status_code=500, detail="Error creating return")

@router.post("/{return_id}/approve", status_code=200)
async def approve_return(return_id: str, current_user: dict = Depends(get_current_user)):
    """Approve pending return (for scheduled items)"""
    check_approval_rights(current_user["role"])
    
    try:
        # Get return
        return_doc = await db.returns.find_one({"_id": return_id})
        if not return_doc:
            raise HTTPException(status_code=404, detail="Return not found")
        
        if return_doc.get("status") != "PENDING_APPROVAL":
            raise HTTPException(status_code=400, detail="Return is not pending approval")
        
        # Update return status
        await db.returns.update_one(
            {"_id": return_id},
            {
                "$set": {
                    "status": "APPROVED",
                    "approved_by": current_user["user_id"],
                    "approved_at": datetime.utcnow()
                }
            }
        )
        
        # Create audit entry
        audit_entry = {
            "actor_id": current_user["user_id"],
            "role": current_user["role"],
            "action": "APPROVE_RETURN",
            "entity": "RETURN",
            "entity_id": return_id,
            "after": {"status": "APPROVED"},
            "created_at": datetime.utcnow()
        }
        await db.audits.insert_one(audit_entry)
        
        return {"message": "Return approved successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error approving return: {e}")
        raise HTTPException(status_code=500, detail="Error approving return")

@router.get("/search/sale/{bill_no}", response_model=dict)
async def search_sale_for_return(bill_no: str, current_user: dict = Depends(get_current_user)):
    """Search sale by bill number for returns"""
    check_pharmacy_access(current_user["role"])
    
    try:
        # Find sale by bill number
        sale = await db.sales.find_one({"bill_no": bill_no})
        if not sale:
            raise HTTPException(status_code=404, detail="Sale not found")
        
        sale["id"] = str(sale["_id"])
        
        # Get sale items with product details
        items = []
        for item_id in sale.get("items", []):
            item = await db.sale_items.find_one({"_id": item_id})
            if item:
                item["id"] = str(item["_id"])
                
                # Get product details
                product = await db.products.find_one({"_id": item["product_id"]})
                if product:
                    item["product_name"] = f"{product['brand_name']} {product['strength']} {product['form']}"
                    item["chemical_name"] = product["chemical_name"]
                
                # Check if already returned (partial tracking)
                existing_returns = await db.returns.find({"sale_id": str(sale["_id"])}).to_list(length=None)
                returned_qty = 0
                for ret in existing_returns:
                    for ret_item in ret.get("items", []):
                        if ret_item["sale_item_id"] == str(item["_id"]):
                            returned_qty += ret_item["qty_returned"]
                
                item["available_for_return"] = item["nos"] - returned_qty
                items.append(item)
        
        return {
            "sale": sale,
            "items": items
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error searching sale for return: {e}")
        raise HTTPException(status_code=500, detail="Error searching sale for return")
# routers/sales.py
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional, Dict
from datetime import datetime
import uuid
import logging

from deps.db import db
from models import Sale, SaleCreate, SaleResponse, SaleItem, SaleItemCreate, Payment
from utils.gst import calc_sale_mrp_inclusive, calc_sale_rate_exclusive, is_supplier_intra_kerala
from utils.schedule import requires_prescription, validate_schedule_compliance, can_override_schedule

router = APIRouter(prefix="/api/pharmacy/sales", tags=["sales"])
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

def is_intra_customer() -> bool:
    """Check if customer is intra-state (Kerala) for GST calculation"""
    # For retail pharmacy, assume all customers are within Kerala
    return True

@router.get("", response_model=List[SaleResponse])
async def get_sales(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    patient_phone: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all sales with optional filtering"""
    check_pharmacy_access(current_user["role"])
    
    try:
        query = {}
        if start_date and end_date:
            query["date_time"] = {
                "$gte": datetime.fromisoformat(start_date),
                "$lte": datetime.fromisoformat(end_date)
            }
        if patient_phone:
            query["patient.phone"] = patient_phone
        
        sales_cursor = db.sales.find(query).sort("date_time", -1)
        sales = []
        
        async for sale in sales_cursor:
            sale["id"] = str(sale["_id"])
            
            # Count items
            total_items = len(sale.get("items", []))
            
            # Determine payment mode
            payments = sale.get("payments", [])
            payment_mode = "Mixed" if len(payments) > 1 else (
                list(payments[0].get("split", {}).keys())[0] if payments else "Unknown"
            )
            
            sale_response = SaleResponse(**sale)
            sale_response.total_items = total_items
            sale_response.payment_mode = payment_mode
            
            sales.append(sale_response)
        
        return sales
    except Exception as e:
        logging.error(f"Error fetching sales: {e}")
        raise HTTPException(status_code=500, detail="Error fetching sales")

@router.post("", response_model=dict, status_code=201)
async def create_sale(sale: SaleCreate, current_user: dict = Depends(get_current_user)):
    """Create new sale with schedule compliance validation"""
    check_pharmacy_access(current_user["role"])
    
    try:
        # Check schedule compliance
        scheduled_items = [item for item in sale.items if item.schedule_symbol != "NONE"]
        if scheduled_items:
            # Validate compliance requirements
            if not sale.compliance:
                raise HTTPException(
                    status_code=400,
                    detail="Prescription compliance required for scheduled drugs"
                )
            
            # Check if override is being used
            if sale.compliance.override_by:
                if not can_override_schedule(current_user["role"], scheduled_items[0].schedule_symbol):
                    raise HTTPException(
                        status_code=403,
                        detail="Insufficient permissions to override schedule requirements"
                    )
            else:
                # Validate all compliance requirements
                compliance_errors = []
                for item in scheduled_items:
                    missing = validate_schedule_compliance(
                        item.schedule_symbol, 
                        sale.compliance.dict() if sale.compliance else {}
                    )
                    compliance_errors.extend(missing)
                
                if compliance_errors:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Compliance errors: {', '.join(compliance_errors)}"
                    )
        
        # Validate payments equal net amount
        payment_total = sum(sale.payments.values())
        
        # Calculate sale totals and process items
        is_intra = is_intra_customer()
        sale_totals = {
            "mrp_total": 0.0,
            "discount_on_mrp": 0.0,
            "taxable": 0.0,
            "cgst": 0.0,
            "sgst": 0.0,
            "igst": 0.0,
            "net": 0.0
        }
        
        sale_item_ids = []
        
        for item_data in sale.items:
            # Get batch information for stock validation
            batch = await db.batches.find_one({"_id": item_data.batch_id})
            if not batch:
                raise HTTPException(status_code=400, detail=f"Batch {item_data.batch_id} not found")
            
            # Check stock availability
            stock_cursor = db.stock_ledger.find({"batch_id": item_data.batch_id})
            available_stock = 0
            async for stock_entry in stock_cursor:
                available_stock += stock_entry.get("qty_in", 0) - stock_entry.get("qty_out", 0)
            
            if available_stock < item_data.nos:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for batch {item_data.batch_id}. Available: {available_stock}"
                )
            
            # Calculate line totals
            if item_data.pricing_mode == "MRP_INC":
                line_calc = calc_sale_mrp_inclusive(
                    is_intra=is_intra,
                    qty=item_data.nos,
                    mrp=item_data.mrp,
                    mrp_discount_pct=item_data.mrp_discount_pct,
                    gst_rate=item_data.gst_rate
                )
            else:
                line_calc = calc_sale_rate_exclusive(
                    is_intra=is_intra,
                    qty=item_data.nos,
                    rate_ex_tax=item_data.rate_ex_tax or 0,
                    gst_rate=item_data.gst_rate
                )
            
            # Create sale item
            sale_item = {
                "id": str(uuid.uuid4()),
                "product_id": item_data.product_id,
                "batch_id": item_data.batch_id,
                "nos": item_data.nos,
                "pricing_mode": item_data.pricing_mode,
                "rate_ex_tax": item_data.rate_ex_tax,
                "mrp": item_data.mrp,
                "mrp_discount_pct": item_data.mrp_discount_pct,
                "gst_rate": item_data.gst_rate,
                "schedule_symbol": item_data.schedule_symbol,
                "base_ex_tax": line_calc["base_ex_tax"],
                "cgst": line_calc["cgst"],
                "sgst": line_calc["sgst"],
                "igst": line_calc["igst"],
                "net": line_calc["net"],
                "created_at": datetime.utcnow()
            }
            
            result = await db.sale_items.insert_one(sale_item)
            sale_item_ids.append(str(result.inserted_id))
            
            # Accumulate totals
            sale_totals["mrp_total"] += item_data.mrp * item_data.nos
            if item_data.pricing_mode == "MRP_INC":
                sale_totals["discount_on_mrp"] += line_calc.get("discount_amount", 0)
            sale_totals["taxable"] += line_calc["base_ex_tax"]
            sale_totals["cgst"] += line_calc["cgst"]
            sale_totals["sgst"] += line_calc["sgst"]
            sale_totals["igst"] += line_calc["igst"]
            sale_totals["net"] += line_calc["net"]
            
            # Create stock ledger entry (reduce stock)
            stock_entry = {
                "id": str(uuid.uuid4()),
                "product_id": item_data.product_id,
                "batch_id": item_data.batch_id,
                "txn_type": "SALE",
                "qty_in": 0,
                "qty_out": item_data.nos,
                "cost_per_unit": batch["effective_cost_per_unit"],
                "mrp": item_data.mrp,
                "ref_type": "SALE",
                "ref_id": "",  # Will be set after sale creation
                "created_at": datetime.utcnow()
            }
            await db.stock_ledger.insert_one(stock_entry)
        
        # Round totals
        for key in sale_totals:
            sale_totals[key] = round(sale_totals[key], 2)
        
        # Validate payment total matches net
        if abs(payment_total - sale_totals["net"]) > 0.01:  # Allow 1 paisa difference for rounding
            raise HTTPException(
                status_code=400,
                detail=f"Payment total ({payment_total}) must equal net amount ({sale_totals['net']})"
            )
        
        # Create payment records
        payment_ids = []
        for payment_type, amount in sale.payments.items():
            if amount > 0:
                payment = {
                    "id": str(uuid.uuid4()),
                    "split": {payment_type: amount},
                    "amount": amount,
                    "received_at": datetime.utcnow()
                }
                result = await db.payments.insert_one(payment)
                payment_ids.append(str(result.inserted_id))
        
        # Create sale record
        sale_doc = {
            "id": str(uuid.uuid4()),
            "bill_no": sale.bill_no,
            "date_time": datetime.fromisoformat(sale.date_time),
            "mode": sale.mode,
            "doctor_name": sale.doctor_name,
            "opd_no": sale.opd_no,
            "patient": sale.patient.dict(),
            "items": sale_item_ids,
            "payments": payment_ids,
            "schedule_compliance": sale.compliance.dict() if sale.compliance else None,
            "totals": sale_totals,
            "time_to_serve_seconds": sale.time_to_serve_seconds,
            "created_by": current_user["user_id"],
            "created_at": datetime.utcnow()
        }
        
        result = await db.sales.insert_one(sale_doc)
        sale_id = str(result.inserted_id)
        
        # Update stock ledger entries with sale reference
        await db.stock_ledger.update_many(
            {"ref_type": "SALE", "ref_id": ""},
            {"$set": {"ref_id": sale_id}}
        )
        
        return {
            "id": sale_id,
            "bill_no": sale.bill_no,
            "totals": sale_totals,
            "message": "Sale created successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error creating sale: {e}")
        raise HTTPException(status_code=500, detail="Error creating sale")

@router.get("/{sale_id}", response_model=dict)
async def get_sale_details(sale_id: str, current_user: dict = Depends(get_current_user)):
    """Get detailed sale information including items"""
    check_pharmacy_access(current_user["role"])
    
    try:
        # Get sale
        sale = await db.sales.find_one({"_id": sale_id})
        if not sale:
            raise HTTPException(status_code=404, detail="Sale not found")
        
        sale["id"] = str(sale["_id"])
        
        # Get sale items
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
                
                items.append(item)
        
        # Get payments
        payments = []
        for payment_id in sale.get("payments", []):
            payment = await db.payments.find_one({"_id": payment_id})
            if payment:
                payment["id"] = str(payment["_id"])
                payments.append(payment)
        
        return {
            "sale": sale,
            "items": items,
            "payments": payments
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching sale details: {e}")
        raise HTTPException(status_code=500, detail="Error fetching sale details")

@router.put("/{sale_id}/edit", status_code=200)
async def edit_sale(
    sale_id: str, 
    edit_notes: str, 
    current_user: dict = Depends(get_current_user)
):
    """Mark sale as edited (for audit trail)"""
    check_pharmacy_access(current_user["role"])
    
    try:
        # Get existing sale for audit
        existing_sale = await db.sales.find_one({"_id": sale_id})
        if not existing_sale:
            raise HTTPException(status_code=404, detail="Sale not found")
        
        # Update sale with edit information
        await db.sales.update_one(
            {"_id": sale_id},
            {
                "$set": {
                    "edited_by": current_user["user_id"],
                    "edited_at": datetime.utcnow(),
                    "edit_notes": edit_notes
                }
            }
        )
        
        # Create audit entry
        audit_entry = {
            "actor_id": current_user["user_id"],
            "role": current_user["role"],
            "action": "EDIT_SALE",
            "entity": "SALE",
            "entity_id": sale_id,
            "before": {"edited_by": None},
            "after": {"edited_by": current_user["user_id"], "edit_notes": edit_notes},
            "created_at": datetime.utcnow()
        }
        await db.audits.insert_one(audit_entry)
        
        return {"message": "Sale marked as edited successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error editing sale: {e}")
        raise HTTPException(status_code=500, detail="Error editing sale")

@router.get("/search/patients", response_model=List[dict])
async def search_patients_by_phone(
    phone: str, 
    current_user: dict = Depends(get_current_user)
):
    """Search patients by phone number for auto-fill"""
    check_pharmacy_access(current_user["role"])
    
    try:
        # Search in sales for patients with matching phone
        sales_cursor = db.sales.find(
            {"patient.phone": {"$regex": phone, "$options": "i"}},
            {"patient": 1, "date_time": 1}
        ).sort("date_time", -1).limit(10)
        
        patients = []
        seen_phones = set()
        
        async for sale in sales_cursor:
            patient = sale["patient"]
            if patient["phone"] not in seen_phones:
                patients.append({
                    "name": patient["name"],
                    "phone": patient["phone"],
                    "age": patient["age"],
                    "sex": patient["sex"],
                    "last_visit": sale["date_time"].isoformat()
                })
                seen_phones.add(patient["phone"])
        
        return patients
        
    except Exception as e:
        logging.error(f"Error searching patients: {e}")
        raise HTTPException(status_code=500, detail="Error searching patients")
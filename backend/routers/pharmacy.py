# routers/pharmacy.py
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional
from datetime import datetime
import uuid
import logging

from deps.db import db
from models import (
    Product, ProductCreate, ProductResponse,
    Supplier, 
    Batch, BatchCreate, BatchResponse,
    Purchase, PurchaseCreate, PurchaseResponse,
    Sale, SaleCreate, SaleResponse,
    Return, ReturnCreate,
    Disposal, DisposalCreate,
    Rack, RackCreate,
    ChemicalSchedule,
    ScheduleSymbol
)
from utils.gst import (
    calc_purchase_line, calc_sale_mrp_inclusive, calc_sale_rate_exclusive,
    is_supplier_intra_kerala, validate_gst_rate, get_expiry_color
)
from utils.schedule import (
    is_more_restrictive, requires_prescription, validate_schedule_compliance,
    can_override_schedule, normalize_chemical_name, propagate_schedule_to_products
)

router = APIRouter(prefix="/api/pharmacy", tags=["pharmacy"])

# Security
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from JWT token - placeholder implementation"""
    # In real implementation, decode JWT and get user info
    return {
        "user_id": "current_user_id",
        "username": "current_user",
        "role": "pharmacist"  # or "admin", "assistant"
    }

def check_pharmacy_access(user_role: str):
    """Check if user has pharmacy access"""
    allowed_roles = ["admin", "pharmacist", "assistant"]
    if user_role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions for pharmacy operations"
        )

def check_approval_rights(user_role: str):
    """Check if user can approve purchases/disposals"""
    if user_role not in ["admin", "pharmacist"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Pharmacist-Incharge or Admin can approve operations"
        )

# Suppliers
@router.get("/suppliers", response_model=List[Supplier])
async def get_suppliers(current_user: dict = Depends(get_current_user)):
    """Get all suppliers"""
    check_pharmacy_access(current_user["role"])
    
    try:
        # Check if database is connected
        if not db.is_connected():
            raise HTTPException(status_code=500, detail="Database not connected")
        
        if db.suppliers is None:
            raise HTTPException(status_code=500, detail="Suppliers collection not available")
            
        suppliers_cursor = db.suppliers.find({})
        suppliers = []
        async for supplier in suppliers_cursor:
            supplier["id"] = str(supplier["_id"])
            suppliers.append(Supplier(**supplier))
        return suppliers
    except Exception as e:
        logging.error(f"Error fetching suppliers: {e}")
        raise HTTPException(status_code=500, detail="Error fetching suppliers")

@router.post("/suppliers", response_model=Supplier, status_code=201)
async def create_supplier(supplier: Supplier, current_user: dict = Depends(get_current_user)):
    """Create new supplier"""
    check_pharmacy_access(current_user["role"])
    
    try:
        supplier_dict = supplier.dict(exclude={"id"})
        supplier_dict["created_at"] = datetime.utcnow()
        supplier_dict["updated_at"] = datetime.utcnow()
        
        result = await db.suppliers.insert_one(supplier_dict)
        supplier_dict["id"] = str(result.inserted_id)
        
        return Supplier(**supplier_dict)
    except Exception as e:
        logging.error(f"Error creating supplier: {e}")
        raise HTTPException(status_code=500, detail="Error creating supplier")

# Products
@router.get("/products", response_model=List[ProductResponse])
async def get_products(
    search: Optional[str] = None,
    schedule: Optional[ScheduleSymbol] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all products with optional search and filtering"""
    check_pharmacy_access(current_user["role"])
    
    try:
        query = {}
        if search:
            query["$or"] = [
                {"brand_name": {"$regex": search, "$options": "i"}},
                {"chemical_name": {"$regex": search, "$options": "i"}}
            ]
        if schedule:
            query["schedule_symbol"] = schedule
        
        products_cursor = db.products.find(query)
        products = []
        
        async for product in products_cursor:
            product["id"] = str(product["_id"])
            
            # Get current stock
            stock_cursor = db.stock_ledger.find({"product_id": product["id"]})
            current_stock = 0
            async for entry in stock_cursor:
                current_stock += entry.get("qty_in", 0) - entry.get("qty_out", 0)
            
            # Count near-expiry batches
            near_expiry_count = await db.batches.count_documents({
                "product_id": product["id"],
                "expiry": {"$lte": datetime.now().strftime("%Y-%m")}
            })
            
            product_response = ProductResponse(**product)
            product_response.current_stock = current_stock
            product_response.near_expiry_batches = near_expiry_count
            
            products.append(product_response)
        
        return products
    except Exception as e:
        logging.error(f"Error fetching products: {e}")
        raise HTTPException(status_code=500, detail="Error fetching products")

@router.post("/products", response_model=ProductResponse, status_code=201)
async def create_product(product: ProductCreate, current_user: dict = Depends(get_current_user)):
    """Create new product with schedule validation"""
    check_pharmacy_access(current_user["role"])
    
    try:
        # Check chemical schedule rules
        chemical_norm = normalize_chemical_name(product.chemical_name)
        existing_chemical = await db.chemical_schedules.find_one({"chemical_name_norm": chemical_norm})
        
        if existing_chemical:
            # Cannot downgrade schedule below chemical canonical
            if not is_more_restrictive(product.schedule_symbol, existing_chemical["schedule_symbol"]):
                raise HTTPException(
                    status_code=400,
                    detail=f"Schedule for {product.chemical_name} must be at least {existing_chemical['schedule_symbol']}"
                )
        else:
            # Create canonical schedule from first product
            chemical_schedule = {
                "chemical_name_norm": chemical_norm,
                "schedule_symbol": product.schedule_symbol,
                "source": "DERIVED",
                "updated_at": datetime.utcnow()
            }
            await db.chemical_schedules.insert_one(chemical_schedule)
        
        # Check for duplicate product
        existing_product = await db.products.find_one({
            "brand_name": product.brand_name,
            "strength": product.strength,
            "form": product.form
        })
        
        if existing_product:
            raise HTTPException(status_code=400, detail="Product already exists")
        
        # Create product
        product_dict = product.dict()
        product_dict["created_at"] = datetime.utcnow()
        product_dict["updated_at"] = datetime.utcnow()
        
        result = await db.products.insert_one(product_dict)
        product_dict["id"] = str(result.inserted_id)
        
        # Return with additional fields
        product_response = ProductResponse(**product_dict)
        product_response.current_stock = 0
        product_response.near_expiry_batches = 0
        
        return product_response
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error creating product: {e}")
        raise HTTPException(status_code=500, detail="Error creating product")

@router.post("/chemicals/{chemical_name}/schedule/{schedule}", status_code=200)
async def set_chemical_schedule(
    chemical_name: str, 
    schedule: ScheduleSymbol, 
    current_user: dict = Depends(get_current_user)
):
    """Set schedule for chemical and propagate to all products"""
    # Allow both admin and pharmacist roles to set chemical schedules
    if current_user["role"] not in ["admin", "pharmacist"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admin or Pharmacist-Incharge can set chemical schedules"
        )
    
    try:
        chemical_norm = normalize_chemical_name(chemical_name)
        
        # Update chemical schedule
        await db.chemical_schedules.update_one(
            {"chemical_name_norm": chemical_norm},
            {
                "$set": {
                    "chemical_name_norm": chemical_norm,
                    "schedule_symbol": schedule,
                    "source": "ADMIN",
                    "updated_at": datetime.utcnow()
                }
            },
            upsert=True
        )
        
        # Propagate to all products (only upgrade, never downgrade)
        propagation_query = propagate_schedule_to_products(chemical_name, schedule)
        result = await db.products.update_many(
            {"chemical_name": {"$regex": f"^{chemical_name}$", "$options": "i"}},
            [propagation_query]
        )
        
        return {
            "message": f"Schedule {schedule} set for {chemical_name}",
            "products_updated": result.modified_count
        }
    except Exception as e:
        logging.error(f"Error setting chemical schedule: {e}")
        raise HTTPException(status_code=500, detail="Error setting chemical schedule")

# Racks
@router.get("/racks", response_model=List[Rack])
async def get_racks(current_user: dict = Depends(get_current_user)):
    """Get all racks"""
    check_pharmacy_access(current_user["role"])
    
    try:
        racks_cursor = db.racks.find({})
        racks = []
        async for rack in racks_cursor:
            rack["id"] = str(rack["_id"])
            racks.append(Rack(**rack))
        return racks
    except Exception as e:
        logging.error(f"Error fetching racks: {e}")
        raise HTTPException(status_code=500, detail="Error fetching racks")

@router.post("/racks", response_model=Rack, status_code=201)
async def create_rack(rack: RackCreate, current_user: dict = Depends(get_current_user)):
    """Create new rack"""
    check_pharmacy_access(current_user["role"])
    
    try:
        rack_dict = rack.dict()
        rack_dict["created_at"] = datetime.utcnow()
        
        result = await db.racks.insert_one(rack_dict)
        rack_dict["id"] = str(result.inserted_id)
        
        return Rack(**rack_dict)
    except Exception as e:
        logging.error(f"Error creating rack: {e}")
        raise HTTPException(status_code=500, detail="Error creating rack")
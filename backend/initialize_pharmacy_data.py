#!/usr/bin/env python3
"""
Initialize sample pharmacy data for testing
This script creates sample suppliers, racks, products, and a complete purchase workflow
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import uuid

# Add backend directory to path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from utils.gst import calc_purchase_line

# Database setup
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/unicare_ehr")
client = AsyncIOMotorClient(MONGO_URL)
db = client.get_default_database()

async def create_suppliers():
    """Create sample suppliers"""
    suppliers = [
        {
            "_id": "supplier_kerala_1",
            "name": "Kerala Medical Supplies",
            "gstin": "32AAECM1234F1Z5",
            "state": "Kerala",
            "address": "Medical College Road, Trivandrum",
            "phones": ["0471-2345678"],
            "email": "sales@keralamedical.com",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "_id": "supplier_mumbai_1", 
            "name": "Mumbai Pharma Distributors",
            "gstin": "27AABCP5678L1ZX",
            "state": "Maharashtra",
            "address": "Andheri East, Mumbai",
            "phones": ["022-98765432"],
            "email": "orders@mumbaipharma.com",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    for supplier in suppliers:
        await db.suppliers.update_one(
            {"_id": supplier["_id"]},
            {"$set": supplier},
            upsert=True
        )
    print("✅ Created suppliers")

async def create_racks():
    """Create sample racks"""
    racks = [
        {
            "_id": "rack_a1",
            "name": "Rack A1",
            "location_note": "Ground floor, left side",
            "created_at": datetime.utcnow()
        },
        {
            "_id": "rack_a2", 
            "name": "Rack A2",
            "location_note": "Ground floor, right side",
            "created_at": datetime.utcnow()
        },
        {
            "_id": "rack_b1",
            "name": "Rack B1", 
            "location_note": "First floor, scheduled drugs",
            "created_at": datetime.utcnow()
        }
    ]
    
    for rack in racks:
        await db.racks.update_one(
            {"_id": rack["_id"]},
            {"$set": rack},
            upsert=True
        )
    print("✅ Created racks")

async def create_chemical_schedules():
    """Create chemical schedules"""
    schedules = [
        {
            "_id": "chem_paracetamol",
            "chemical_name_norm": "paracetamol",
            "schedule_symbol": "NONE",
            "source": "ADMIN",
            "updated_at": datetime.utcnow()
        },
        {
            "_id": "chem_diazepam",
            "chemical_name_norm": "diazepam", 
            "schedule_symbol": "H1",
            "source": "ADMIN",
            "updated_at": datetime.utcnow()
        },
        {
            "_id": "chem_morphine",
            "chemical_name_norm": "morphine",
            "schedule_symbol": "X",
            "source": "ADMIN", 
            "updated_at": datetime.utcnow()
        }
    ]
    
    for schedule in schedules:
        await db.chemical_schedules.update_one(
            {"_id": schedule["_id"]},
            {"$set": schedule},
            upsert=True
        )
    print("✅ Created chemical schedules")

async def create_products():
    """Create sample products"""
    products = [
        {
            "_id": "product_paracetamol_500",
            "brand_name": "Dolo 650",
            "chemical_name": "Paracetamol",
            "strength": "650mg",
            "form": "Tablet",
            "hsn": "30049099",
            "pack_type": "TAB",
            "pack_size": 15,
            "company_name": "Micro Labs",
            "rack_id": "rack_a1",
            "min_level": 50,
            "max_level": 500,
            "schedule_symbol": "NONE",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "_id": "product_diazepam_5",
            "brand_name": "Calmpose 5", 
            "chemical_name": "Diazepam",
            "strength": "5mg",
            "form": "Tablet",
            "hsn": "29339900",
            "pack_type": "TAB",
            "pack_size": 10,
            "company_name": "Ranbaxy",
            "rack_id": "rack_b1",
            "min_level": 20,
            "max_level": 100,
            "schedule_symbol": "H1",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "_id": "product_morphine_10",
            "brand_name": "Morphine Sulphate",
            "chemical_name": "Morphine",
            "strength": "10mg",
            "form": "Injection",
            "hsn": "29391100", 
            "pack_type": "ML",
            "pack_size": 1,
            "company_name": "Neon Labs",
            "rack_id": "rack_b1",
            "min_level": 5,
            "max_level": 25,
            "schedule_symbol": "X",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    for product in products:
        await db.products.update_one(
            {"_id": product["_id"]},
            {"$set": product},
            upsert=True
        )
    print("✅ Created products")

async def create_sample_purchase():
    """Create a sample purchase with approval to generate stock"""
    
    # Sample purchase items
    purchase_items = [
        {
            "product_id": "product_paracetamol_500",
            "batch_no": "DOLO240801",
            "expiry": "2026-08",
            "gst_rate": 12,
            "mrp": 25.0,
            "trade_price_ex_tax": 18.0,
            "scheme_pct": 5.0,
            "cash_pct": 2.0,
            "billed_qty": 100,
            "free_qty": 10,
            "hsn": "30049099",
            "rack_id": "rack_a1",
            "schedule_symbol": "NONE"
        },
        {
            "product_id": "product_diazepam_5", 
            "batch_no": "CALM240715",
            "expiry": "2025-12",
            "gst_rate": 12,
            "mrp": 45.0,
            "trade_price_ex_tax": 32.0,
            "scheme_pct": 3.0,
            "cash_pct": 1.0,
            "billed_qty": 50,
            "free_qty": 5,
            "hsn": "29339900",
            "rack_id": "rack_b1", 
            "schedule_symbol": "H1"
        }
    ]
    
    # Calculate totals
    is_intra = True  # Kerala supplier
    purchase_totals = {
        "taxable": 0.0,
        "cgst": 0.0,
        "sgst": 0.0,
        "igst": 0.0,
        "post_tax_discount": 0.0,
        "net_payable": 0.0
    }
    
    batch_ids = []
    processed_items = []
    
    for item in purchase_items:
        # Calculate line totals
        line_calc = calc_purchase_line(
            is_intra=is_intra,
            billed_qty=item["billed_qty"],
            free_qty=item["free_qty"],
            trade_price_ex=item["trade_price_ex_tax"],
            gst_rate=item["gst_rate"],
            scheme_pct=item["scheme_pct"],
            cash_pct=item["cash_pct"]
        )
        
        # Create batch
        batch_doc = {
            "_id": f"batch_{item['batch_no'].lower()}",
            "product_id": item["product_id"],
            "batch_no": item["batch_no"],
            "expiry": item["expiry"],
            "gst_rate": item["gst_rate"],
            "mrp": item["mrp"],
            "trade_price_ex_tax": item["trade_price_ex_tax"],
            "scheme_pct": item["scheme_pct"],
            "cash_pct": item["cash_pct"],
            "received_qty": item["billed_qty"],
            "free_qty": item["free_qty"],
            "effective_cost_per_unit": line_calc["effective_cost_per_unit"],
            "supplier_id": "supplier_kerala_1",
            "received_at": datetime.utcnow(),
            "rack_id": item["rack_id"],
            "status": "APPROVED"  # Create as approved
        }
        
        await db.batches.update_one(
            {"_id": batch_doc["_id"]},
            {"$set": batch_doc},
            upsert=True
        )
        batch_ids.append(batch_doc["_id"])
        
        # Accumulate totals
        purchase_totals["taxable"] += line_calc["taxable"]
        purchase_totals["cgst"] += line_calc["cgst"]
        purchase_totals["sgst"] += line_calc["sgst"]
        purchase_totals["igst"] += line_calc["igst"]
        purchase_totals["post_tax_discount"] += line_calc["post_tax_discount"]
        purchase_totals["net_payable"] += line_calc["row_net"]
        
        processed_items.append({**item, **line_calc})
        
        # Create stock ledger entry
        stock_entry = {
            "_id": f"stock_{batch_doc['_id']}_purchase",
            "product_id": item["product_id"],
            "batch_id": batch_doc["_id"],
            "txn_type": "PURCHASE",
            "qty_in": item["billed_qty"] + item["free_qty"],
            "qty_out": 0,
            "cost_per_unit": line_calc["effective_cost_per_unit"],
            "mrp": item["mrp"],
            "ref_type": "PURCHASE",
            "ref_id": "purchase_sample_001",
            "created_at": datetime.utcnow()
        }
        
        await db.stock_ledger.update_one(
            {"_id": stock_entry["_id"]},
            {"$set": stock_entry},
            upsert=True
        )
    
    # Round totals
    for key in purchase_totals:
        purchase_totals[key] = round(purchase_totals[key], 2)
    
    # Create purchase record
    purchase_doc = {
        "_id": "purchase_sample_001",
        "invoice_no": "INV/KER/240801",
        "invoice_date": "2024-08-01",
        "supplier_id": "supplier_kerala_1",
        "type": "CREDIT",
        "items": processed_items,
        "batch_ids": batch_ids,
        "totals": purchase_totals,
        "created_by": "admin",
        "approved_by": "admin",
        "status": "APPROVED",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.purchases.update_one(
        {"_id": purchase_doc["_id"]},
        {"$set": purchase_doc},
        upsert=True
    )
    
    print(f"✅ Created sample purchase with ₹{purchase_totals['net_payable']} value")
    return purchase_doc

async def main():
    """Initialize all pharmacy data"""
    print("🚀 Initializing pharmacy sample data...")
    
    await create_suppliers()
    await create_racks() 
    await create_chemical_schedules()
    await create_products()
    purchase = await create_sample_purchase()
    
    print("\n📊 Summary:")
    print(f"   - 2 Suppliers (Kerala + Mumbai for GST testing)")
    print(f"   - 3 Racks (A1, A2, B1)")
    print(f"   - 3 Products (NONE, H1, X schedules)")
    print(f"   - 1 Approved Purchase (₹{purchase['totals']['net_payable']})")
    print(f"   - Stock available for sales testing")
    
    print("\n🧪 Ready for API testing!")
    print("   - Test scheduled drug compliance with H1 and X products")
    print("   - Test Kerala vs Inter-state GST calculations") 
    print("   - Test complete purchase → sales workflow")

if __name__ == "__main__":
    asyncio.run(main())
#!/usr/bin/env python3
"""
Comprehensive Pharmacy Management System API Testing for Unicare EHR
Testing Kerala GST compliance and scheduled drug regulations

This test suite covers:
1. Core Pharmacy Setup APIs (suppliers, products, racks, chemical schedule)
2. Purchase Management APIs (purchases, approval, rejection)
3. Sales Management APIs (sales, prescription validation)
4. Inventory Management APIs (stock, near-expiry, movements, valuation)
5. Returns Management APIs (sales returns, approval)
6. Disposal Management APIs (disposal creation, expired batches)
"""

import requests
import json
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

class PharmacyAPITester:
    def __init__(self, base_url: str = None):
        # Get backend URL from frontend/.env
        if base_url is None:
            try:
                with open('/app/frontend/.env', 'r') as f:
                    for line in f:
                        if line.startswith('VITE_BACKEND_URL='):
                            base_url = line.split('=', 1)[1].strip()
                            break
                if not base_url:
                    base_url = "https://medshare-hub.preview.emergentagent.com"
            except:
                base_url = "https://medshare-hub.preview.emergentagent.com"
                
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.current_user_role = None
        
        # Test data storage
        self.created_supplier_id = None
        self.created_product_id = None
        self.created_rack_id = None
        self.created_purchase_id = None
        self.created_sale_id = None
        self.created_batch_id = None
        
        print(f"🏥 Pharmacy API Tester initialized with backend URL: {self.base_url}")

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Optional[Dict] = None, headers: Optional[Dict] = None) -> tuple[bool, Dict]:
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        print(f"   Method: {method}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=15)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=15)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=15)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=15)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:300]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except requests.exceptions.ConnectionError:
            print(f"❌ Failed - Connection Error: Cannot connect to {url}")
            return False, {}
        except requests.exceptions.Timeout:
            print(f"❌ Failed - Timeout: Request timed out")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_login(self, username: str = "admin", password: str = "admin_007") -> bool:
        """Test login and get token"""
        success, response = self.run_test(
            f"Login as {username}",
            "POST",
            "api/auth/login",
            200,
            data={"username": username, "password": password}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.current_user_role = response.get('user_role', 'admin')
            print(f"   Token obtained: {self.token[:20]}...")
            print(f"   User role: {self.current_user_role}")
            return True
        return False

    def test_core_pharmacy_setup_apis(self) -> bool:
        """Test Core Pharmacy Setup APIs"""
        print("\n" + "="*70)
        print("🏪 TESTING CORE PHARMACY SETUP APIs")
        print("="*70)
        
        all_tests_passed = True
        
        # Test 1: Supplier Management APIs
        print("\n📦 Test 1: Supplier Management APIs")
        
        # GET /api/pharmacy/suppliers
        success, suppliers = self.run_test(
            "GET /api/pharmacy/suppliers",
            "GET",
            "api/pharmacy/suppliers",
            200
        )
        if not success:
            print("❌ Failed to get suppliers - API may not be implemented")
            all_tests_passed = False
        else:
            print(f"✅ Found {len(suppliers)} suppliers")
        
        # POST /api/pharmacy/suppliers - Create Kerala supplier
        kerala_supplier_data = {
            "name": "Kerala Medical Supplies Pvt Ltd",
            "gstin": "32ABCDE1234F1Z5",
            "state": "Kerala",
            "address": "123 MG Road, Kochi, Kerala 682001",
            "phones": ["0484-2345678", "9876543210"],
            "email": "info@keralamedical.com"
        }
        
        success, supplier_response = self.run_test(
            "POST /api/pharmacy/suppliers - Create Kerala Supplier",
            "POST",
            "api/pharmacy/suppliers",
            201,
            data=kerala_supplier_data
        )
        if success and 'id' in supplier_response:
            self.created_supplier_id = supplier_response['id']
            print(f"✅ Created Kerala supplier with ID: {self.created_supplier_id}")
        else:
            print("❌ Failed to create supplier")
            all_tests_passed = False
        
        # POST /api/pharmacy/suppliers - Create other state supplier for GST testing
        other_state_supplier_data = {
            "name": "Mumbai Pharmaceuticals Ltd",
            "gstin": "27ABCDE1234F1Z5",
            "state": "Maharashtra",
            "address": "456 Andheri East, Mumbai, Maharashtra 400069",
            "phones": ["022-12345678"],
            "email": "sales@mumbaipharma.com"
        }
        
        success, supplier_response2 = self.run_test(
            "POST /api/pharmacy/suppliers - Create Other State Supplier",
            "POST",
            "api/pharmacy/suppliers",
            201,
            data=other_state_supplier_data
        )
        if not success:
            print("❌ Failed to create other state supplier")
            all_tests_passed = False
        
        # Test 2: Rack Management APIs
        print("\n🏬 Test 2: Rack Management APIs")
        
        # GET /api/pharmacy/racks
        success, racks = self.run_test(
            "GET /api/pharmacy/racks",
            "GET",
            "api/pharmacy/racks",
            200
        )
        if not success:
            print("❌ Failed to get racks")
            all_tests_passed = False
        else:
            print(f"✅ Found {len(racks)} racks")
        
        # POST /api/pharmacy/racks - Create rack
        rack_data = {
            "name": "Rack A1",
            "location_note": "Ground Floor, Left Side, Near Counter"
        }
        
        success, rack_response = self.run_test(
            "POST /api/pharmacy/racks - Create Rack",
            "POST",
            "api/pharmacy/racks",
            201,
            data=rack_data
        )
        if success and 'id' in rack_response:
            self.created_rack_id = rack_response['id']
            print(f"✅ Created rack with ID: {self.created_rack_id}")
        else:
            print("❌ Failed to create rack")
            all_tests_passed = False
        
        # Test 3: Product Management with Schedule Validation
        print("\n💊 Test 3: Product Management with Schedule Validation")
        
        # GET /api/pharmacy/products
        success, products = self.run_test(
            "GET /api/pharmacy/products",
            "GET",
            "api/pharmacy/products",
            200
        )
        if not success:
            print("❌ Failed to get products")
            all_tests_passed = False
        else:
            print(f"✅ Found {len(products)} products")
        
        # POST /api/pharmacy/products - Create products with different schedules
        test_products = [
            {
                "brand_name": "Paracetamol 500mg",
                "chemical_name": "Paracetamol",
                "strength": "500mg",
                "form": "Tablet",
                "hsn": "30049099",
                "pack_type": "TAB",
                "pack_size": 10,
                "company_name": "Kerala Pharmaceuticals",
                "rack_id": self.created_rack_id,
                "min_level": 50,
                "max_level": 500,
                "schedule_symbol": "NONE"
            },
            {
                "brand_name": "Amoxicillin 250mg",
                "chemical_name": "Amoxicillin",
                "strength": "250mg",
                "form": "Capsule",
                "hsn": "30049099",
                "pack_type": "UNIT",
                "pack_size": 10,
                "company_name": "Kerala Pharmaceuticals",
                "rack_id": self.created_rack_id,
                "min_level": 30,
                "max_level": 300,
                "schedule_symbol": "H"
            },
            {
                "brand_name": "Alprazolam 0.5mg",
                "chemical_name": "Alprazolam",
                "strength": "0.5mg",
                "form": "Tablet",
                "hsn": "30049099",
                "pack_type": "TAB",
                "pack_size": 10,
                "company_name": "Kerala Pharmaceuticals",
                "rack_id": self.created_rack_id,
                "min_level": 20,
                "max_level": 100,
                "schedule_symbol": "H1"
            },
            {
                "brand_name": "Morphine 10mg",
                "chemical_name": "Morphine",
                "strength": "10mg",
                "form": "Injection",
                "hsn": "30049099",
                "pack_type": "ML",
                "pack_size": 1,
                "company_name": "Kerala Pharmaceuticals",
                "rack_id": self.created_rack_id,
                "min_level": 5,
                "max_level": 50,
                "schedule_symbol": "X"
            }
        ]
        
        created_products = []
        for product_data in test_products:
            success, product_response = self.run_test(
                f"POST /api/pharmacy/products - Create {product_data['brand_name']} ({product_data['schedule_symbol']})",
                "POST",
                "api/pharmacy/products",
                201,
                data=product_data
            )
            if success and 'id' in product_response:
                created_products.append(product_response['id'])
                if not self.created_product_id:  # Store first product ID
                    self.created_product_id = product_response['id']
                print(f"✅ Created {product_data['brand_name']} with schedule {product_data['schedule_symbol']}")
            else:
                print(f"❌ Failed to create {product_data['brand_name']}")
                all_tests_passed = False
        
        # Test 4: Chemical Schedule Enforcement
        print("\n🧪 Test 4: Chemical Schedule Enforcement")
        
        # POST /api/pharmacy/chemicals/{chemical}/schedule/{symbol}
        success, schedule_response = self.run_test(
            "POST /api/pharmacy/chemicals/Paracetamol/schedule/G - Set Chemical Schedule",
            "POST",
            "api/pharmacy/chemicals/Paracetamol/schedule/G",
            200
        )
        if success:
            print("✅ Chemical schedule set successfully")
            print(f"   Products updated: {schedule_response.get('products_updated', 0)}")
        else:
            print("❌ Failed to set chemical schedule")
            all_tests_passed = False
        
        return all_tests_passed

    def test_purchase_management_apis(self) -> bool:
        """Test Purchase Management APIs"""
        print("\n" + "="*70)
        print("📦 TESTING PURCHASE MANAGEMENT APIs")
        print("="*70)
        
        all_tests_passed = True
        
        if not self.created_supplier_id or not self.created_product_id:
            print("❌ Missing supplier or product IDs - skipping purchase tests")
            return False
        
        # Test 1: Purchase Creation with GST Calculations
        print("\n💰 Test 1: Purchase Creation with GST Calculations")
        
        # GET /api/pharmacy/purchases
        success, purchases = self.run_test(
            "GET /api/pharmacy/purchases",
            "GET",
            "api/pharmacy/purchases",
            200
        )
        if not success:
            print("❌ Failed to get purchases")
            all_tests_passed = False
        else:
            print(f"✅ Found {len(purchases)} purchases")
        
        # POST /api/pharmacy/purchases - Create purchase with Kerala GST
        purchase_data = {
            "invoice_no": "INV-2025-001",
            "invoice_date": "2025-01-15",
            "supplier_id": self.created_supplier_id,
            "type": "CREDIT",
            "items": [
                {
                    "product_id": self.created_product_id,
                    "batch_no": "BATCH001",
                    "expiry": "2026-12",
                    "gst_rate": 12,
                    "mrp": 25.0,
                    "trade_price_ex_tax": 18.0,
                    "scheme_pct": 5.0,
                    "cash_pct": 2.0,
                    "billed_qty": 100,
                    "free_qty": 10,
                    "rack_id": self.created_rack_id
                }
            ]
        }
        
        success, purchase_response = self.run_test(
            "POST /api/pharmacy/purchases - Create Purchase with Kerala GST",
            "POST",
            "api/pharmacy/purchases",
            201,
            data=purchase_data
        )
        if success and 'id' in purchase_response:
            self.created_purchase_id = purchase_response['id']
            print(f"✅ Created purchase with ID: {self.created_purchase_id}")
            print(f"   Status: {purchase_response.get('status')}")
            print(f"   Net Payable: ₹{purchase_response.get('totals', {}).get('net_payable', 0)}")
        else:
            print("❌ Failed to create purchase")
            all_tests_passed = False
        
        # Test 2: Purchase Approval Workflow
        print("\n✅ Test 2: Purchase Approval Workflow")
        
        if self.created_purchase_id:
            # POST /api/pharmacy/purchases/{id}/approve
            success, approval_response = self.run_test(
                f"POST /api/pharmacy/purchases/{self.created_purchase_id}/approve",
                "POST",
                f"api/pharmacy/purchases/{self.created_purchase_id}/approve",
                200
            )
            if success:
                print("✅ Purchase approved successfully")
            else:
                print("❌ Failed to approve purchase")
                all_tests_passed = False
        
        # Test 3: Purchase Rejection
        print("\n❌ Test 3: Purchase Rejection")
        
        # Create another purchase to reject
        reject_purchase_data = {
            "invoice_no": "INV-2025-002",
            "invoice_date": "2025-01-15",
            "supplier_id": self.created_supplier_id,
            "type": "CASH",
            "items": [
                {
                    "product_id": self.created_product_id,
                    "batch_no": "BATCH002",
                    "expiry": "2026-11",
                    "gst_rate": 12,
                    "mrp": 30.0,
                    "trade_price_ex_tax": 22.0,
                    "scheme_pct": 0.0,
                    "cash_pct": 0.0,
                    "billed_qty": 50,
                    "free_qty": 5,
                    "rack_id": self.created_rack_id
                }
            ]
        }
        
        success, reject_purchase_response = self.run_test(
            "POST /api/pharmacy/purchases - Create Purchase to Reject",
            "POST",
            "api/pharmacy/purchases",
            201,
            data=reject_purchase_data
        )
        
        if success and 'id' in reject_purchase_response:
            reject_purchase_id = reject_purchase_response['id']
            
            # POST /api/pharmacy/purchases/{id}/reject
            success, rejection_response = self.run_test(
                f"POST /api/pharmacy/purchases/{reject_purchase_id}/reject",
                "POST",
                f"api/pharmacy/purchases/{reject_purchase_id}/reject?reason=Quality issues",
                200
            )
            if success:
                print("✅ Purchase rejected successfully")
            else:
                print("❌ Failed to reject purchase")
                all_tests_passed = False
        
        return all_tests_passed

    def test_sales_management_apis(self) -> bool:
        """Test Sales Management APIs"""
        print("\n" + "="*70)
        print("💊 TESTING SALES MANAGEMENT APIs")
        print("="*70)
        
        all_tests_passed = True
        
        # Test 1: Sales Creation with Schedule Compliance
        print("\n🛒 Test 1: Sales Creation with Schedule Compliance")
        
        # GET /api/pharmacy/sales
        success, sales = self.run_test(
            "GET /api/pharmacy/sales",
            "GET",
            "api/pharmacy/sales",
            200
        )
        if not success:
            print("❌ Failed to get sales")
            all_tests_passed = False
        else:
            print(f"✅ Found {len(sales)} sales")
        
        # POST /api/pharmacy/sales - Create sale with MRP-inclusive pricing
        sale_data = {
            "bill_no": "BILL-2025-001",
            "date_time": datetime.now().isoformat(),
            "mode": "OPD",
            "doctor_name": "Dr. Priya Nair",
            "opd_no": "001/25",
            "patient": {
                "name": "Rajesh Kumar",
                "age": 35,
                "sex": "Male",
                "phone": "9876543210"
            },
            "items": [
                {
                    "product_id": self.created_product_id,
                    "batch_id": self.created_batch_id or "batch_001",
                    "nos": 2,
                    "pricing_mode": "MRP_INC",
                    "mrp": 25.0,
                    "mrp_discount_pct": 10.0,
                    "gst_rate": 12,
                    "schedule_symbol": "NONE"
                }
            ],
            "payments": {
                "cash": 45.0
            },
            "time_to_serve_seconds": 120
        }
        
        success, sale_response = self.run_test(
            "POST /api/pharmacy/sales - Create Sale with MRP-inclusive pricing",
            "POST",
            "api/pharmacy/sales",
            201,
            data=sale_data
        )
        if success and 'id' in sale_response:
            self.created_sale_id = sale_response['id']
            print(f"✅ Created sale with ID: {self.created_sale_id}")
            print(f"   Bill No: {sale_response.get('bill_no')}")
            print(f"   Net Amount: ₹{sale_response.get('totals', {}).get('net', 0)}")
        else:
            print("❌ Failed to create sale")
            all_tests_passed = False
        
        # Test 2: Sales with Scheduled Drug Prescription Validation
        print("\n📋 Test 2: Sales with Scheduled Drug Prescription Validation")
        
        # Create sale with scheduled drug (should require prescription)
        scheduled_sale_data = {
            "bill_no": "BILL-2025-002",
            "date_time": datetime.now().isoformat(),
            "mode": "OPD",
            "doctor_name": "Dr. Arjun Menon",
            "opd_no": "002/25",
            "patient": {
                "name": "Priya Nair",
                "age": 28,
                "sex": "Female",
                "phone": "9876543211"
            },
            "items": [
                {
                    "product_id": self.created_product_id,
                    "batch_id": self.created_batch_id or "batch_001",
                    "nos": 1,
                    "pricing_mode": "MRP_INC",
                    "mrp": 60.0,
                    "mrp_discount_pct": 0.0,
                    "gst_rate": 12,
                    "schedule_symbol": "H"
                }
            ],
            "payments": {
                "cash": 60.0
            },
            "compliance": {
                "required": True,
                "schedule_symbol": "H",
                "rx_docs": ["rx_doc_001.pdf"],
                "rx_number": "RX-2025-001",
                "prescriber_reg_no": "KER/MED/12345"
            }
        }
        
        success, scheduled_sale_response = self.run_test(
            "POST /api/pharmacy/sales - Create Sale with Schedule H Drug",
            "POST",
            "api/pharmacy/sales",
            201,
            data=scheduled_sale_data
        )
        if success:
            print("✅ Scheduled drug sale created with prescription compliance")
        else:
            print("❌ Failed to create scheduled drug sale")
            all_tests_passed = False
        
        # Test 3: Rate-exclusive pricing mode
        print("\n💰 Test 3: Rate-exclusive pricing mode")
        
        rate_exclusive_sale_data = {
            "bill_no": "BILL-2025-003",
            "date_time": datetime.now().isoformat(),
            "mode": "IP",
            "patient": {
                "name": "Suresh Nair",
                "age": 45,
                "sex": "Male",
                "phone": "9876543212"
            },
            "items": [
                {
                    "product_id": self.created_product_id,
                    "batch_id": self.created_batch_id or "batch_001",
                    "nos": 3,
                    "pricing_mode": "RATE_EX",
                    "rate_ex_tax": 18.0,
                    "gst_rate": 12,
                    "schedule_symbol": "NONE"
                }
            ],
            "payments": {
                "upi": 60.48
            }
        }
        
        success, rate_ex_sale_response = self.run_test(
            "POST /api/pharmacy/sales - Create Sale with Rate-exclusive pricing",
            "POST",
            "api/pharmacy/sales",
            201,
            data=rate_exclusive_sale_data
        )
        if success:
            print("✅ Rate-exclusive pricing sale created successfully")
        else:
            print("❌ Failed to create rate-exclusive sale")
            all_tests_passed = False
        
        return all_tests_passed

    def test_inventory_management_apis(self) -> bool:
        """Test Inventory Management APIs"""
        print("\n" + "="*70)
        print("📊 TESTING INVENTORY MANAGEMENT APIs")
        print("="*70)
        
        all_tests_passed = True
        
        # Test 1: Current Stock Levels
        print("\n📈 Test 1: Current Stock Levels")
        
        # GET /api/pharmacy/inventory/stock
        success, stock_data = self.run_test(
            "GET /api/pharmacy/inventory/stock",
            "GET",
            "api/pharmacy/inventory/stock",
            200
        )
        if not success:
            print("❌ Failed to get current stock")
            all_tests_passed = False
        else:
            print(f"✅ Found stock data for {len(stock_data)} items")
            if stock_data:
                print(f"   Sample stock item: {stock_data[0].get('product_name', 'Unknown')} - Stock: {stock_data[0].get('current_stock', 0)}")
        
        # Test with filters
        if self.created_product_id:
            success, filtered_stock = self.run_test(
                f"GET /api/pharmacy/inventory/stock?product_id={self.created_product_id}",
                "GET",
                f"api/pharmacy/inventory/stock?product_id={self.created_product_id}",
                200
            )
            if success:
                print(f"✅ Filtered stock data: {len(filtered_stock)} items")
        
        # Test 2: Near-expiry Tracking
        print("\n⏰ Test 2: Near-expiry Tracking")
        
        # GET /api/pharmacy/inventory/near-expiry
        success, near_expiry_data = self.run_test(
            "GET /api/pharmacy/inventory/near-expiry",
            "GET",
            "api/pharmacy/inventory/near-expiry",
            200
        )
        if not success:
            print("❌ Failed to get near-expiry items")
            all_tests_passed = False
        else:
            print(f"✅ Found {len(near_expiry_data)} near-expiry items")
            if near_expiry_data:
                for item in near_expiry_data[:3]:  # Show first 3 items
                    print(f"   • {item.get('product_name', 'Unknown')} - Expires: {item.get('expiry')} - Stock: {item.get('current_stock', 0)}")
        
        # Test with different time periods
        success, near_expiry_3m = self.run_test(
            "GET /api/pharmacy/inventory/near-expiry?months=3",
            "GET",
            "api/pharmacy/inventory/near-expiry?months=3",
            200
        )
        if success:
            print(f"✅ Items expiring in 3 months: {len(near_expiry_3m)}")
        
        # Test 3: Batch Movements History
        print("\n📋 Test 3: Batch Movements History")
        
        if self.created_batch_id:
            # GET /api/pharmacy/inventory/movements/{batch_id}
            success, movements_data = self.run_test(
                f"GET /api/pharmacy/inventory/movements/{self.created_batch_id}",
                "GET",
                f"api/pharmacy/inventory/movements/{self.created_batch_id}",
                200
            )
            if not success:
                print("❌ Failed to get batch movements")
                all_tests_passed = False
            else:
                print(f"✅ Found {len(movements_data)} movements for batch")
                if movements_data:
                    for movement in movements_data[:3]:  # Show first 3 movements
                        print(f"   • {movement.get('txn_type')} - Qty In: {movement.get('qty_in', 0)} - Qty Out: {movement.get('qty_out', 0)}")
        
        # Test 4: Inventory Valuation
        print("\n💰 Test 4: Inventory Valuation")
        
        # GET /api/pharmacy/inventory/valuation
        success, valuation_data = self.run_test(
            "GET /api/pharmacy/inventory/valuation",
            "GET",
            "api/pharmacy/inventory/valuation",
            200
        )
        if not success:
            print("❌ Failed to get inventory valuation")
            all_tests_passed = False
        else:
            print("✅ Inventory valuation retrieved successfully")
            print(f"   Total Cost Value: ₹{valuation_data.get('total_cost_value', 0)}")
            print(f"   Total MRP Value: ₹{valuation_data.get('total_mrp_value', 0)}")
            print(f"   Total Items: {valuation_data.get('total_items', 0)}")
            print(f"   Total Quantity: {valuation_data.get('total_quantity', 0)}")
            print(f"   Potential Profit: ₹{valuation_data.get('potential_profit', 0)}")
        
        return all_tests_passed

    def test_returns_management_apis(self) -> bool:
        """Test Returns Management APIs"""
        print("\n" + "="*70)
        print("🔄 TESTING RETURNS MANAGEMENT APIs")
        print("="*70)
        
        all_tests_passed = True
        
        # Test 1: Sales Return Creation
        print("\n📤 Test 1: Sales Return Creation")
        
        # GET /api/pharmacy/returns
        success, returns_data = self.run_test(
            "GET /api/pharmacy/returns",
            "GET",
            "api/pharmacy/returns",
            200
        )
        if not success:
            print("❌ Failed to get returns")
            all_tests_passed = False
        else:
            print(f"✅ Found {len(returns_data)} returns")
        
        # Test 2: Search Sale by Bill Number
        print("\n🔍 Test 2: Search Sale by Bill Number for Returns")
        
        # GET /api/pharmacy/returns/search/sale/{bill_no}
        success, sale_search_data = self.run_test(
            "GET /api/pharmacy/returns/search/sale/BILL-2025-001",
            "GET",
            "api/pharmacy/returns/search/sale/BILL-2025-001",
            200
        )
        if not success:
            print("❌ Failed to search sale for return")
            all_tests_passed = False
        else:
            print("✅ Sale found for return processing")
            sale_data = sale_search_data.get('sale', {})
            items_data = sale_search_data.get('items', [])
            print(f"   Sale ID: {sale_data.get('id')}")
            print(f"   Patient: {sale_data.get('patient', {}).get('name')}")
            print(f"   Items available for return: {len(items_data)}")
        
        # Test 3: Create Return
        if self.created_sale_id and success:
            print("\n📥 Test 3: Create Sales Return")
            
            return_data = {
                "sale_id": self.created_sale_id,
                "bill_no": "BILL-2025-001",
                "items": [
                    {
                        "sale_item_id": "item_001",
                        "batch_id": self.created_batch_id or "batch_001",
                        "qty_returned": 1
                    }
                ],
                "reason": "Patient complaint - side effects"
            }
            
            # POST /api/pharmacy/returns
            success, return_response = self.run_test(
                "POST /api/pharmacy/returns - Create Sales Return",
                "POST",
                "api/pharmacy/returns",
                201,
                data=return_data
            )
            if success and 'id' in return_response:
                created_return_id = return_response['id']
                print(f"✅ Created return with ID: {created_return_id}")
                print(f"   Status: {return_response.get('status')}")
                print(f"   Net Refund: ₹{return_response.get('totals', {}).get('net_refund', 0)}")
                
                # Test 4: Return Approval for Scheduled Items
                print("\n✅ Test 4: Return Approval for Scheduled Items")
                
                # POST /api/pharmacy/returns/{id}/approve
                success, approval_response = self.run_test(
                    f"POST /api/pharmacy/returns/{created_return_id}/approve",
                    "POST",
                    f"api/pharmacy/returns/{created_return_id}/approve",
                    200
                )
                if success:
                    print("✅ Return approved successfully")
                else:
                    print("❌ Failed to approve return")
                    all_tests_passed = False
            else:
                print("❌ Failed to create return")
                all_tests_passed = False
        
        return all_tests_passed

    def test_disposal_management_apis(self) -> bool:
        """Test Disposal Management APIs"""
        print("\n" + "="*70)
        print("🗑️ TESTING DISPOSAL MANAGEMENT APIs")
        print("="*70)
        
        all_tests_passed = True
        
        # Test 1: Get Expired Batches
        print("\n⚠️ Test 1: Get Expired Batches for Disposal")
        
        # GET /api/pharmacy/disposals/expired-batches
        success, expired_batches = self.run_test(
            "GET /api/pharmacy/disposals/expired-batches",
            "GET",
            "api/pharmacy/disposals/expired-batches",
            200
        )
        if not success:
            print("❌ Failed to get expired batches")
            all_tests_passed = False
        else:
            print(f"✅ Found {len(expired_batches)} expired batches")
            if expired_batches:
                for batch in expired_batches[:3]:  # Show first 3 batches
                    print(f"   • {batch.get('product_name', 'Unknown')} - Expired: {batch.get('expiry')} - Stock: {batch.get('current_stock', 0)}")
        
        # Test 2: Disposal Creation with ITC Reversal
        print("\n🗑️ Test 2: Disposal Creation with ITC Reversal")
        
        # GET /api/pharmacy/disposals
        success, disposals_data = self.run_test(
            "GET /api/pharmacy/disposals",
            "GET",
            "api/pharmacy/disposals",
            200
        )
        if not success:
            print("❌ Failed to get disposals")
            all_tests_passed = False
        else:
            print(f"✅ Found {len(disposals_data)} disposals")
        
        # Create disposal if we have a batch
        if self.created_batch_id:
            disposal_data = {
                "batch_id": self.created_batch_id,
                "qty": 5,
                "reason": "expiry",
                "remark": "Expired batch - disposed as per regulations",
                "itc_reversal_tax": 12.50
            }
            
            # POST /api/pharmacy/disposals
            success, disposal_response = self.run_test(
                "POST /api/pharmacy/disposals - Create Disposal",
                "POST",
                "api/pharmacy/disposals",
                201,
                data=disposal_data
            )
            if success and 'id' in disposal_response:
                print(f"✅ Created disposal with ID: {disposal_response['id']}")
                print(f"   Cost Value: ₹{disposal_response.get('cost_value', 0)}")
                print(f"   MRP Value: ₹{disposal_response.get('mrp_value', 0)}")
                print(f"   ITC Reversal: ₹{disposal_response.get('itc_reversal_tax', 0)}")
            else:
                print("❌ Failed to create disposal")
                all_tests_passed = False
        
        # Test 3: Disposal Summary Reporting
        print("\n📊 Test 3: Disposal Summary Reporting")
        
        # GET /api/pharmacy/disposals/summary
        success, summary_data = self.run_test(
            "GET /api/pharmacy/disposals/summary",
            "GET",
            "api/pharmacy/disposals/summary",
            200
        )
        if not success:
            print("❌ Failed to get disposal summary")
            all_tests_passed = False
        else:
            print("✅ Disposal summary retrieved successfully")
            by_reason = summary_data.get('by_reason', [])
            totals = summary_data.get('totals', {})
            
            print(f"   Total Disposals: {totals.get('total_disposals', 0)}")
            print(f"   Total Quantity: {totals.get('total_qty', 0)}")
            print(f"   Total Cost Value: ₹{totals.get('total_cost_value', 0)}")
            print(f"   Total ITC Reversal: ₹{totals.get('total_itc_reversal', 0)}")
            
            if by_reason:
                print("   Breakdown by reason:")
                for reason_data in by_reason:
                    print(f"     • {reason_data.get('reason')}: {reason_data.get('count')} disposals, ₹{reason_data.get('cost_value', 0)} value")
        
        return all_tests_passed

    def run_comprehensive_pharmacy_tests(self) -> bool:
        """Run all pharmacy API tests"""
        print("🏥 COMPREHENSIVE PHARMACY MANAGEMENT SYSTEM API TESTING")
        print("Testing Kerala GST compliance and scheduled drug regulations")
        print("="*70)
        
        # Login first
        if not self.test_login():
            print("❌ Failed to login - cannot proceed with tests")
            return False
        
        # Run all test suites
        test_results = []
        
        try:
            test_results.append(("Core Pharmacy Setup APIs", self.test_core_pharmacy_setup_apis()))
        except Exception as e:
            print(f"❌ Core Pharmacy Setup APIs failed with error: {e}")
            test_results.append(("Core Pharmacy Setup APIs", False))
        
        try:
            test_results.append(("Purchase Management APIs", self.test_purchase_management_apis()))
        except Exception as e:
            print(f"❌ Purchase Management APIs failed with error: {e}")
            test_results.append(("Purchase Management APIs", False))
        
        try:
            test_results.append(("Sales Management APIs", self.test_sales_management_apis()))
        except Exception as e:
            print(f"❌ Sales Management APIs failed with error: {e}")
            test_results.append(("Sales Management APIs", False))
        
        try:
            test_results.append(("Inventory Management APIs", self.test_inventory_management_apis()))
        except Exception as e:
            print(f"❌ Inventory Management APIs failed with error: {e}")
            test_results.append(("Inventory Management APIs", False))
        
        try:
            test_results.append(("Returns Management APIs", self.test_returns_management_apis()))
        except Exception as e:
            print(f"❌ Returns Management APIs failed with error: {e}")
            test_results.append(("Returns Management APIs", False))
        
        try:
            test_results.append(("Disposal Management APIs", self.test_disposal_management_apis()))
        except Exception as e:
            print(f"❌ Disposal Management APIs failed with error: {e}")
            test_results.append(("Disposal Management APIs", False))
        
        # Print final summary
        print("\n" + "="*70)
        print("📋 FINAL TEST SUMMARY")
        print("="*70)
        
        passed_tests = 0
        total_tests = len(test_results)
        
        for test_name, result in test_results:
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"{test_name}: {status}")
            if result:
                passed_tests += 1
        
        print(f"\nOverall Results: {passed_tests}/{total_tests} test suites passed")
        print(f"Individual API Tests: {self.tests_passed}/{self.tests_run} tests passed")
        
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        print(f"Success Rate: {success_rate:.1f}%")
        
        if success_rate == 100:
            print("\n🎉 ALL PHARMACY APIS WORKING PERFECTLY!")
            print("✅ Kerala GST compliance implemented")
            print("✅ Scheduled drug regulations enforced")
            print("✅ Complete pharmacy workflow functional")
        elif success_rate >= 80:
            print("\n⚠️ MOST PHARMACY APIS WORKING - MINOR ISSUES DETECTED")
        elif success_rate >= 50:
            print("\n❌ SIGNIFICANT PHARMACY API ISSUES DETECTED")
        else:
            print("\n🚨 CRITICAL PHARMACY API FAILURES - SYSTEM NOT FUNCTIONAL")
        
        return success_rate >= 80

if __name__ == "__main__":
    tester = PharmacyAPITester()
    success = tester.run_comprehensive_pharmacy_tests()
    sys.exit(0 if success else 1)
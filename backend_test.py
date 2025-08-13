import requests
import sys
import json
from datetime import datetime

class UnicareEHRTester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.patient_id = None
        self.current_user_role = None
        
        # Test accounts as specified in the review request
        self.test_accounts = {
            "admin": {"username": "admin", "password": "admin_007"},
            "reception": {"username": "reception1", "password": "reception123"},
            "laboratory": {"username": "lab1", "password": "lab123"},
            "pharmacy": {"username": "pharmacy1", "password": "pharmacy123"},
            "nursing": {"username": "nurse1", "password": "nurse123"},
            "doctor": {"username": "doctor1", "password": "doctor123"}
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
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
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
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

    def test_health_check(self):
        """Test health check endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "api/health",
            200
        )
        return success

    def test_login(self, username=None, password=None, role="admin"):
        """Test login and get token"""
        if username is None:
            creds = self.test_accounts[role]
            username = creds["username"]
            password = creds["password"]
            
        success, response = self.run_test(
            f"Login as {role} ({username})",
            "POST",
            "api/auth/login",
            200,
            data={"username": username, "password": password}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.current_user_role = response.get('user_role', role)
            print(f"   Token obtained: {self.token[:20]}...")
            print(f"   User role: {self.current_user_role}")
            return True
        return False

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        success, response = self.run_test(
            "Invalid Login",
            "POST",
            "api/auth/login",
            401,
            data={"username": "invalid", "password": "invalid"}
        )
        return success

    def test_get_doctors(self):
        """Test getting doctors list"""
        success, response = self.run_test(
            "Get Doctors",
            "GET",
            "api/doctors",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} doctors")
            return True
        return False

    def test_doctors_api_comprehensive(self):
        """Comprehensive test for doctors API endpoint as per review request"""
        print("\n👨‍⚕️ Testing Doctors API Endpoint Comprehensively...")
        
        # Login as admin to access doctors API
        if not self.test_login(role="admin"):
            print("❌ Failed to login as admin for doctors API testing")
            return False
            
        print("\n📋 Test 1: GET /api/doctors - Basic functionality")
        success, doctors_response = self.run_test(
            "GET /api/doctors",
            "GET",
            "api/doctors",
            200
        )
        
        if not success:
            print("❌ Failed to get doctors list")
            return False
            
        if not isinstance(doctors_response, list):
            print(f"❌ Expected list response, got {type(doctors_response)}")
            return False
            
        print(f"✅ Successfully retrieved {len(doctors_response)} doctors")
        
        if len(doctors_response) == 0:
            print("⚠️ No doctors found in system")
            return False
            
        # Test 2: Verify doctor data structure
        print("\n🔍 Test 2: Verify doctor data structure and required fields")
        
        required_fields = ['id', 'name', 'specialty', 'default_fee']
        all_doctors_valid = True
        
        for i, doctor in enumerate(doctors_response):
            print(f"\n   Doctor {i+1}: {doctor.get('name', 'Unknown')}")
            
            # Check required fields
            missing_fields = [field for field in required_fields if field not in doctor]
            if missing_fields:
                print(f"   ❌ Missing required fields: {missing_fields}")
                all_doctors_valid = False
            else:
                print(f"   ✅ All required fields present")
                
            # Check default_fee field specifically
            default_fee = doctor.get('default_fee')
            if default_fee is None:
                print(f"   ❌ default_fee field is missing")
                all_doctors_valid = False
            else:
                print(f"   📊 default_fee: {default_fee} (type: {type(default_fee).__name__})")
                
                # Check if default_fee is string type as expected by frontend
                if not isinstance(default_fee, str):
                    print(f"   ⚠️ default_fee is {type(default_fee).__name__}, frontend expects string")
                    # This is a critical issue for frontend compatibility
                    all_doctors_valid = False
                else:
                    print(f"   ✅ default_fee is string type as expected")
                    
                # Verify it's a valid numeric string
                try:
                    float(default_fee)
                    print(f"   ✅ default_fee is valid numeric string")
                except ValueError:
                    print(f"   ❌ default_fee '{default_fee}' is not a valid numeric string")
                    all_doctors_valid = False
                    
            # Check other important fields
            specialty = doctor.get('specialty', '')
            name = doctor.get('name', '')
            
            print(f"   📝 Name: '{name}'")
            print(f"   🏥 Specialty: '{specialty}'")
            
            if not name.strip():
                print(f"   ❌ Doctor name is empty")
                all_doctors_valid = False
                
            if not specialty.strip():
                print(f"   ⚠️ Doctor specialty is empty")
                
        if not all_doctors_valid:
            print("\n❌ Doctor data structure validation failed")
            return False
            
        print("\n✅ All doctors have valid data structure")
        
        # Test 3: Check response format matches frontend expectations
        print("\n🎯 Test 3: Verify response format matches frontend expectations")
        
        sample_doctor = doctors_response[0]
        expected_structure = {
            'id': 'string',
            'name': 'string', 
            'specialty': 'string',
            'default_fee': 'string'  # Critical: frontend expects string
        }
        
        structure_valid = True
        for field, expected_type in expected_structure.items():
            if field not in sample_doctor:
                print(f"   ❌ Missing field: {field}")
                structure_valid = False
                continue
                
            actual_value = sample_doctor[field]
            actual_type = type(actual_value).__name__
            
            if expected_type == 'string' and not isinstance(actual_value, str):
                print(f"   ❌ Field '{field}': expected string, got {actual_type}")
                structure_valid = False
            else:
                print(f"   ✅ Field '{field}': {actual_type} ✓")
                
        if not structure_valid:
            print("\n❌ Response structure doesn't match frontend expectations")
            return False
            
        print("\n✅ Response structure matches frontend expectations")
        
        # Test 4: Test API performance and timeout issues
        print("\n⏱️ Test 4: Test API performance (checking for timeout issues)")
        
        import time
        start_time = time.time()
        
        success, response = self.run_test(
            "GET /api/doctors - Performance Test",
            "GET", 
            "api/doctors",
            200
        )
        
        end_time = time.time()
        response_time = end_time - start_time
        
        print(f"   Response time: {response_time:.2f} seconds")
        
        if response_time > 5.0:
            print(f"   ⚠️ Slow response time: {response_time:.2f}s (may cause frontend timeout)")
        elif response_time > 2.0:
            print(f"   ⚠️ Moderate response time: {response_time:.2f}s")
        else:
            print(f"   ✅ Good response time: {response_time:.2f}s")
            
        # Test 5: Test with different user roles
        print("\n🔐 Test 5: Test doctors API access with different roles")
        
        roles_to_test = ["reception", "doctor", "laboratory", "pharmacy", "nursing"]
        access_results = {}
        
        for role in roles_to_test:
            if self.test_login(role=role):
                success, response = self.run_test(
                    f"GET /api/doctors as {role}",
                    "GET",
                    "api/doctors", 
                    200
                )
                access_results[role] = success
                if success:
                    print(f"   ✅ {role} can access doctors API")
                else:
                    print(f"   ❌ {role} cannot access doctors API")
            else:
                print(f"   ❌ Failed to login as {role}")
                access_results[role] = False
                
        successful_roles = sum(access_results.values())
        print(f"\n   📊 {successful_roles}/{len(roles_to_test)} roles can access doctors API")
        
        # Test 6: Verify data consistency
        print("\n🔄 Test 6: Verify data consistency across multiple requests")
        
        # Make multiple requests and verify consistent data
        responses = []
        for i in range(3):
            success, response = self.run_test(
                f"GET /api/doctors - Consistency Test {i+1}",
                "GET",
                "api/doctors",
                200
            )
            if success:
                responses.append(response)
                
        if len(responses) < 3:
            print("   ❌ Failed to get consistent responses")
            return False
            
        # Check if all responses are identical
        first_response = responses[0]
        consistent = all(resp == first_response for resp in responses[1:])
        
        if consistent:
            print("   ✅ Data is consistent across multiple requests")
        else:
            print("   ❌ Data inconsistency detected across requests")
            return False
            
        print("\n🎉 Doctors API Comprehensive Testing Completed!")
        
        # Summary of findings
        print("\n📋 SUMMARY OF FINDINGS:")
        print(f"   • Total doctors found: {len(doctors_response)}")
        print(f"   • All required fields present: {'✅' if all_doctors_valid else '❌'}")
        print(f"   • default_fee field type: {'✅ String' if all(isinstance(d.get('default_fee'), str) for d in doctors_response) else '❌ Not String'}")
        print(f"   • API response time: {response_time:.2f}s")
        print(f"   • Role-based access: {successful_roles}/{len(roles_to_test)} roles working")
        print(f"   • Data consistency: {'✅' if consistent else '❌'}")
        
        return all_doctors_valid and structure_valid and consistent

    def test_create_patient(self):
        """Test creating a new patient with all required fields as per review request"""
        # First get doctors to assign one
        success, doctors_response = self.run_test(
            "Get Doctors for Patient Assignment",
            "GET",
            "api/doctors",
            200
        )
        
        if not success or not doctors_response:
            print("❌ Failed to get doctors for patient assignment")
            return False
            
        doctor_id = doctors_response[0]['id'] if doctors_response else None
        if not doctor_id:
            print("❌ No doctors available for assignment")
            return False
            
        # Create patient with all required fields from review request
        patient_data = {
            "patient_name": "Rajesh Kumar",
            "age": "35",
            "dob": "1989-03-15",
            "sex": "Male",
            "address": "123 MG Road, Kochi, Kerala",
            "phone_number": "9876543210",
            "assigned_doctor": doctor_id,
            "visit_type": "New",
            "patient_rating": 7
        }
        
        success, response = self.run_test(
            "Create Patient with All Required Fields",
            "POST",
            "api/patients",
            200,
            data=patient_data
        )
        
        if success and 'id' in response:
            self.patient_id = response['id']
            print(f"   Patient created with ID: {self.patient_id}")
            print(f"   OPD Number: {response.get('opd_number', 'N/A')}")
            print(f"   Token Number: {response.get('token_number', 'N/A')}")
            
            # Verify all fields are returned
            required_fields = ['patient_name', 'phone_number', 'sex', 'age', 'opd_number', 'token_number']
            missing_fields = [field for field in required_fields if field not in response or not response[field]]
            
            if missing_fields:
                print(f"❌ Missing required fields in response: {missing_fields}")
                return False
                
            print(f"✅ All required fields present in response")
            return True
        return False

    def test_get_patients(self):
        """Test getting patients list"""
        success, response = self.run_test(
            "Get Patients",
            "GET",
            "api/patients",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} patients")
            return True
        return False

    def test_get_patient_by_id(self):
        """Test getting a specific patient by ID"""
        if not self.patient_id:
            print("❌ Skipped - No patient ID available")
            return False
            
        success, response = self.run_test(
            "Get Patient by ID",
            "GET",
            f"api/patients/{self.patient_id}",
            200
        )
        return success

    def test_update_patient(self):
        """Test updating a patient"""
        if not self.patient_id:
            print("❌ Skipped - No patient ID available")
            return False
            
        updated_data = {
            "patient_name": "Updated Test Patient",
            "age": "31",
            "dob": "1993-01-01",
            "sex": "Male",
            "address": "456 Updated Street",
            "phone_number": "0987654321"
        }
        
        success, response = self.run_test(
            "Update Patient",
            "PUT",
            f"api/patients/{self.patient_id}",
            200,
            data=updated_data
        )
        return success

    def test_delete_patient(self):
        """Test deleting a patient"""
        if not self.patient_id:
            print("❌ Skipped - No patient ID available")
            return False
            
        success, response = self.run_test(
            "Delete Patient",
            "DELETE",
            f"api/patients/{self.patient_id}",
            200
        )
        return success

    def test_unauthorized_access(self):
        """Test accessing protected endpoints without token"""
        # Temporarily remove token
        original_token = self.token
        self.token = None
        
        success, response = self.run_test(
            "Unauthorized Access",
            "GET",
            "api/patients",
            401
        )
        
        # Restore token
        self.token = original_token
        return success

    def test_create_test_users(self):
        """Create test users for all roles"""
        print("\n🔧 Creating test users for all roles...")
        
        # First login as admin
        if not self.test_login(role="admin"):
            print("❌ Failed to login as admin to create users")
            return False
        
        users_to_create = [
            {
                "username": "reception1",
                "password": "reception123", 
                "full_name": "Reception User",
                "role": "reception",
                "department": "Reception"
            },
            {
                "username": "lab1",
                "password": "lab123",
                "full_name": "Laboratory User", 
                "role": "laboratory",
                "department": "Laboratory"
            },
            {
                "username": "pharmacy1",
                "password": "pharmacy123",
                "full_name": "Pharmacy User",
                "role": "pharmacy", 
                "department": "Pharmacy"
            },
            {
                "username": "nurse1",
                "password": "nurse123",
                "full_name": "Nursing User",
                "role": "nursing",
                "department": "Nursing"
            },
            {
                "username": "doctor1", 
                "password": "doctor123",
                "full_name": "Doctor User",
                "role": "doctor",
                "department": "Medical"
            }
        ]
        
        created_count = 0
        for user_data in users_to_create:
            success, response = self.run_test(
                f"Create {user_data['role']} user",
                "POST",
                "api/users",
                200,
                data=user_data
            )
            if success:
                created_count += 1
            elif "already exists" in str(response):
                print(f"   User {user_data['username']} already exists - OK")
                created_count += 1
        
        print(f"✅ Created/verified {created_count}/{len(users_to_create)} test users")
        return created_count == len(users_to_create)

    def test_role_based_login(self):
        """Test login for all roles"""
        print("\n🔐 Testing role-based login...")
        
        login_results = {}
        for role in self.test_accounts.keys():
            success = self.test_login(role=role)
            login_results[role] = success
            
        successful_logins = sum(login_results.values())
        print(f"✅ {successful_logins}/{len(login_results)} role logins successful")
        return successful_logins == len(login_results)

    def test_admin_apis(self):
        """Test admin-specific APIs"""
        print("\n👑 Testing Admin APIs...")
        
        if not self.test_login(role="admin"):
            return False
            
        # Test user management
        success1, response = self.run_test(
            "Get All Users (Admin)",
            "GET", 
            "api/users",
            200
        )
        
        if success1:
            print(f"   Found {len(response)} users in system")
        
        return success1

    def test_reception_apis(self):
        """Test reception-specific APIs"""
        print("\n🏥 Testing Reception APIs...")
        
        if not self.test_login(role="reception"):
            return False
            
        # Test patient management
        success1 = self.test_create_patient()
        success2 = self.test_get_patients()
        
        return success1 and success2

    def test_laboratory_apis(self):
        """Test laboratory-specific APIs"""
        print("\n🧪 Testing Laboratory APIs...")
        
        if not self.test_login(role="laboratory"):
            return False
            
        # Test lab tests
        success1, response = self.run_test(
            "Get Lab Tests",
            "GET",
            "api/lab/tests", 
            200
        )
        
        if success1:
            print(f"   Found {len(response)} lab tests")
            
        # Test lab orders
        success2, response = self.run_test(
            "Get Lab Orders",
            "GET",
            "api/lab/orders",
            200
        )
        
        if success2:
            print(f"   Found {len(response)} lab orders")
            
        return success1 and success2

    def test_pharmacy_apis(self):
        """Test pharmacy-specific APIs"""
        print("\n💊 Testing Pharmacy APIs...")
        
        if not self.test_login(role="pharmacy"):
            return False
            
        # Test medications
        success1, response = self.run_test(
            "Get Medications",
            "GET",
            "api/pharmacy/medications",
            200
        )
        
        if success1:
            print(f"   Found {len(response)} medications")
            
        # Test prescriptions
        success2, response = self.run_test(
            "Get Prescriptions", 
            "GET",
            "api/pharmacy/prescriptions",
            200
        )
        
        if success2:
            print(f"   Found {len(response)} prescriptions")
            
        return success1 and success2

    def test_nursing_apis(self):
        """Test nursing-specific APIs"""
        print("\n🩺 Testing Nursing APIs...")
        
        if not self.test_login(role="nursing"):
            return False
            
        # Test vitals
        success1, response = self.run_test(
            "Get Vital Signs",
            "GET", 
            "api/nursing/vitals",
            200
        )
        
        if success1:
            print(f"   Found {len(response)} vital records")
            
        # Test procedures
        success2, response = self.run_test(
            "Get Nursing Procedures",
            "GET",
            "api/nursing/procedures", 
            200
        )
        
        if success2:
            print(f"   Found {len(response)} nursing procedures")
            
        return success1 and success2

    def test_doctor_apis(self):
        """Test doctor-specific APIs"""
        print("\n👨‍⚕️ Testing Doctor APIs...")
        
        if not self.test_login(role="doctor"):
            return False
            
        # Test consultations
        success1, response = self.run_test(
            "Get Consultations",
            "GET",
            "api/emr/consultations",
            200
        )
        
        if success1:
            print(f"   Found {len(response)} consultations")
            
        return success1

    def test_role_based_access_control(self):
        """Test that roles can only access their permitted endpoints"""
        print("\n🔒 Testing Role-Based Access Control...")
        
        # Test reception user trying to access admin endpoint
        if not self.test_login(role="reception"):
            return False
            
        success, response = self.run_test(
            "Reception accessing Admin endpoint (should fail)",
            "GET",
            "api/users",
            403  # Should be forbidden
        )
        
        if success:
            print("✅ Access control working - reception blocked from admin endpoint")
            
        return success

    def test_cross_module_integration(self):
        """Test integration between different modules"""
        print("\n🔄 Testing Cross-Module Integration...")
        
        # Login as admin first to create a patient
        if not self.test_login(role="admin"):
            return False
            
        # Create a test patient
        patient_data = {
            "patient_name": "Integration Test Patient",
            "age": "25",
            "sex": "Female", 
            "phone_number": "9876543210"
        }
        
        success, patient_response = self.run_test(
            "Create Patient for Integration Test",
            "POST",
            "api/patients",
            200,
            data=patient_data
        )
        
        if not success:
            return False
            
        patient_id = patient_response.get('id')
        print(f"   Created patient with ID: {patient_id}")
        
        # Test that different roles can access patient data
        roles_to_test = ["doctor", "nursing", "laboratory"]
        access_results = []
        
        for role in roles_to_test:
            if self.test_login(role=role):
                # Try to get patient vitals (should work for all medical roles)
                success, response = self.run_test(
                    f"{role} accessing patient vitals",
                    "GET",
                    f"api/patients/{patient_id}/vitals",
                    200
                )
                access_results.append(success)
        
        successful_access = sum(access_results)
        print(f"✅ {successful_access}/{len(roles_to_test)} roles can access patient data")
        
    def test_patient_registration_workflow(self):
        """Test the complete patient registration workflow as per review request"""
        print("\n🏥 Testing Patient Registration Workflow (POST /api/patients)...")
        
        # Login as reception (who can create patients)
        if not self.test_login(role="reception"):
            print("❌ Failed to login as reception for patient registration")
            return False
            
        # Get doctors first
        success, doctors_response = self.run_test(
            "Get Doctors List",
            "GET",
            "api/doctors",
            200
        )
        
        if not success or not doctors_response:
            print("❌ Failed to get doctors list")
            return False
            
        doctor_id = doctors_response[0]['id'] if doctors_response else None
        
        # Test 1: Create patient with all required fields
        print("\n📝 Test 1: Patient creation with all required fields")
        patient_data = {
            "patient_name": "Priya Nair",
            "phone_number": "9876543210", 
            "sex": "Female",
            "age": "28",
            "assigned_doctor": doctor_id,
            "visit_type": "New",
            "patient_rating": 8,
            "address": "456 Marine Drive, Ernakulam, Kerala",
            "dob": "1996-07-20"
        }
        
        success, patient_response = self.run_test(
            "Create Patient with All Required Fields",
            "POST",
            "api/patients",
            200,
            data=patient_data
        )
        
        if not success:
            return False
            
        created_patient_id = patient_response.get('id')
        opd_number = patient_response.get('opd_number')
        token_number = patient_response.get('token_number')
        
        # Test 2: Verify OPD and token number generation
        print("\n🔢 Test 2: Verify OPD and token number generation")
        if not opd_number or not token_number:
            print("❌ OPD or token number not generated")
            return False
            
        # Check OPD number format (should be NNN/YY)
        import re
        if not re.match(r'^\d{3}/\d{2}$', opd_number):
            print(f"❌ Invalid OPD number format: {opd_number} (expected: NNN/YY)")
            return False
            
        print(f"✅ OPD number generated correctly: {opd_number}")
        print(f"✅ Token number generated: {token_number}")
        
        # Test 3: Verify created patient data is returned properly
        print("\n📋 Test 3: Verify patient data returned with all fields")
        required_fields = ['id', 'patient_name', 'phone_number', 'sex', 'age', 'opd_number', 'token_number', 'created_at']
        missing_fields = [field for field in required_fields if field not in patient_response]
        
        if missing_fields:
            print(f"❌ Missing fields in response: {missing_fields}")
            return False
            
        print("✅ All required fields present in patient response")
        
        # Test 4: Verify patient appears in GET /api/patients
        print("\n📊 Test 4: Verify patient appears in patients list")
        success, patients_list = self.run_test(
            "Get All Patients",
            "GET", 
            "api/patients",
            200
        )
        
        if not success:
            return False
            
        # Find our created patient in the list
        created_patient_found = any(p.get('id') == created_patient_id for p in patients_list)
        if not created_patient_found:
            print(f"❌ Created patient {created_patient_id} not found in patients list")
            return False
            
        print(f"✅ Created patient found in patients list ({len(patients_list)} total patients)")
        
        # Test 5: Test duplicate OPD number prevention
        print("\n🔒 Test 5: Test duplicate OPD number prevention")
        # Create another patient and verify different OPD number
        patient_data2 = {
            "patient_name": "Arjun Menon",
            "phone_number": "9876543211",
            "sex": "Male", 
            "age": "32",
            "assigned_doctor": doctor_id,
            "visit_type": "New",
            "patient_rating": 6
        }
        
        success, patient_response2 = self.run_test(
            "Create Second Patient",
            "POST",
            "api/patients", 
            200,
            data=patient_data2
        )
        
        if not success:
            return False
            
        opd_number2 = patient_response2.get('opd_number')
        if opd_number == opd_number2:
            print(f"❌ Duplicate OPD numbers generated: {opd_number}")
            return False
            
        print(f"✅ Unique OPD numbers generated: {opd_number} vs {opd_number2}")
        
        # Test 6: Test missing required fields
        print("\n❌ Test 6: Test edge cases - missing required fields")
        
        # Test missing patient_name
        invalid_data = {"phone_number": "9876543212", "sex": "Male", "age": "25"}
        success, response = self.run_test(
            "Create Patient - Missing Name",
            "POST",
            "api/patients",
            422,  # Validation error expected
            data=invalid_data
        )
        
        if success:
            print("✅ Correctly rejected patient with missing name")
        else:
            print("⚠️ Missing name validation may need improvement")
            
        # Test missing phone_number
        invalid_data2 = {"patient_name": "Test User", "sex": "Male", "age": "25"}
        success, response = self.run_test(
            "Create Patient - Missing Phone",
            "POST", 
            "api/patients",
            422,  # Validation error expected
            data=invalid_data2
        )
        
        if success:
            print("✅ Correctly rejected patient with missing phone")
        else:
            print("⚠️ Missing phone validation may need improvement")
            
        # Test 7: Check timestamps and formatting
        print("\n⏰ Test 7: Check timestamps and formatting")
        created_at = patient_response.get('created_at')
        if not created_at:
            print("❌ Missing created_at timestamp")
            return False
            
        # Verify timestamp format
        try:
            from datetime import datetime
            datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            print("✅ Timestamp format is valid")
        except:
            print(f"❌ Invalid timestamp format: {created_at}")
            return False
            
        print("\n🎉 Patient Registration Workflow Tests Completed Successfully!")
        return True

    def test_patient_24hour_log_critical_bug(self):
        """Test the critical bug: Patient registration not adding to 24-hour patient log"""
        print("\n🚨 CRITICAL BUG TEST: Patient Registration → 24-Hour Log Integration")
        print("Issue: Patients registered today not appearing in 24-hour patient log")
        print("=" * 70)
        
        # Login as reception
        if not self.test_login(role="reception"):
            print("❌ Failed to login as reception")
            return False
            
        # Get doctors first
        success, doctors_response = self.run_test(
            "Get Doctors for Assignment",
            "GET",
            "api/doctors",
            200
        )
        
        if not success or not doctors_response:
            print("❌ Failed to get doctors")
            return False
            
        doctor_id = doctors_response[0]['id']
        
        # Test 1: Create a new patient and check created_at timestamp
        print("\n📝 Test 1: POST /api/patients - Create patient and check created_at timestamp")
        
        from datetime import datetime, timezone
        import pytz
        
        # Get current time in Asia/Kolkata timezone
        kolkata_tz = pytz.timezone('Asia/Kolkata')
        current_time_kolkata = datetime.now(kolkata_tz)
        current_date_kolkata = current_time_kolkata.date()
        
        print(f"   Current time in Asia/Kolkata: {current_time_kolkata}")
        print(f"   Current date in Asia/Kolkata: {current_date_kolkata}")
        
        patient_data = {
            "patient_name": "Timezone Test Patient",
            "phone_number": "9876543299",
            "sex": "Male",
            "age": "30",
            "assigned_doctor": doctor_id,
            "visit_type": "New",
            "patient_rating": 5,
            "address": "Test Address, Kerala",
            "dob": "1994-01-01"
        }
        
        success, patient_response = self.run_test(
            "Create New Patient",
            "POST",
            "api/patients",
            200,
            data=patient_data
        )
        
        if not success:
            print("❌ Failed to create patient")
            return False
            
        created_at_str = patient_response.get('created_at')
        if not created_at_str:
            print("❌ No created_at timestamp in response")
            return False
            
        print(f"   ✅ Patient created with ID: {patient_response.get('id')}")
        print(f"   📅 created_at timestamp: {created_at_str}")
        
        # Parse the created_at timestamp
        try:
            # Handle different timestamp formats
            if created_at_str.endswith('Z'):
                created_at_utc = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
            elif '+' in created_at_str or created_at_str.endswith('00:00'):
                created_at_utc = datetime.fromisoformat(created_at_str)
            else:
                # Assume UTC if no timezone info
                created_at_utc = datetime.fromisoformat(created_at_str).replace(tzinfo=timezone.utc)
                
            # Convert to Asia/Kolkata timezone
            created_at_kolkata = created_at_utc.astimezone(kolkata_tz)
            created_date_kolkata = created_at_kolkata.date()
            
            print(f"   🌍 UTC timestamp: {created_at_utc}")
            print(f"   🇮🇳 Asia/Kolkata timestamp: {created_at_kolkata}")
            print(f"   📅 Date in Asia/Kolkata: {created_date_kolkata}")
            
            # Check if the date matches today's date in Asia/Kolkata
            if created_date_kolkata == current_date_kolkata:
                print("   ✅ Patient created with today's date in Asia/Kolkata timezone")
            else:
                print(f"   ❌ Date mismatch! Created: {created_date_kolkata}, Today: {current_date_kolkata}")
                print("   🚨 CRITICAL BUG: Timezone issue detected!")
                
        except Exception as e:
            print(f"   ❌ Error parsing timestamp: {e}")
            return False
            
        # Test 2: GET /api/patients - Check if today's patients are returned
        print("\n📊 Test 2: GET /api/patients - Check if today's patients are returned")
        
        success, all_patients = self.run_test(
            "Get All Patients",
            "GET",
            "api/patients",
            200
        )
        
        if not success:
            print("❌ Failed to get patients list")
            return False
            
        print(f"   📈 Total patients in system: {len(all_patients)}")
        
        # Filter patients created today (in Asia/Kolkata timezone)
        today_patients = []
        timezone_issues = []
        
        for patient in all_patients:
            patient_created_at = patient.get('created_at')
            if not patient_created_at:
                continue
                
            try:
                # Parse patient timestamp
                if patient_created_at.endswith('Z'):
                    patient_utc = datetime.fromisoformat(patient_created_at.replace('Z', '+00:00'))
                elif '+' in patient_created_at:
                    patient_utc = datetime.fromisoformat(patient_created_at)
                else:
                    patient_utc = datetime.fromisoformat(patient_created_at).replace(tzinfo=timezone.utc)
                    
                # Convert to Asia/Kolkata
                patient_kolkata = patient_utc.astimezone(kolkata_tz)
                patient_date_kolkata = patient_kolkata.date()
                
                if patient_date_kolkata == current_date_kolkata:
                    today_patients.append({
                        'name': patient.get('patient_name'),
                        'id': patient.get('id'),
                        'created_at_utc': patient_utc,
                        'created_at_kolkata': patient_kolkata,
                        'opd_number': patient.get('opd_number')
                    })
                else:
                    # Check if there's a timezone issue
                    patient_utc_date = patient_utc.date()
                    if patient_utc_date == current_date_kolkata:
                        timezone_issues.append({
                            'name': patient.get('patient_name'),
                            'utc_date': patient_utc_date,
                            'kolkata_date': patient_date_kolkata
                        })
                        
            except Exception as e:
                print(f"   ⚠️ Error parsing timestamp for patient {patient.get('patient_name')}: {e}")
                
        print(f"   📅 Patients created today (Asia/Kolkata): {len(today_patients)}")
        
        if today_patients:
            print("   ✅ Today's patients found:")
            for patient in today_patients:
                print(f"      • {patient['name']} (OPD: {patient['opd_number']}) - {patient['created_at_kolkata']}")
        else:
            print("   ❌ No patients found for today in Asia/Kolkata timezone")
            print("   🚨 CRITICAL BUG CONFIRMED: Patients not appearing in today's log!")
            
        if timezone_issues:
            print(f"   ⚠️ Potential timezone issues detected ({len(timezone_issues)} patients):")
            for issue in timezone_issues:
                print(f"      • {issue['name']}: UTC date {issue['utc_date']} vs Kolkata date {issue['kolkata_date']}")
                
        # Test 3: Test date filtering logic simulation
        print("\n🔍 Test 3: Simulate 24-hour log date filtering logic")
        
        # Simulate how PatientLogPageFixed might filter patients
        # This is likely where the bug occurs
        
        # Method 1: Filter by UTC date (WRONG - this is likely the bug)
        utc_today = datetime.now(timezone.utc).date()
        utc_filtered = []
        
        for patient in all_patients:
            patient_created_at = patient.get('created_at')
            if patient_created_at:
                try:
                    if patient_created_at.endswith('Z'):
                        patient_utc = datetime.fromisoformat(patient_created_at.replace('Z', '+00:00'))
                    else:
                        patient_utc = datetime.fromisoformat(patient_created_at).replace(tzinfo=timezone.utc)
                    
                    if patient_utc.date() == utc_today:
                        utc_filtered.append(patient.get('patient_name'))
                except:
                    pass
                    
        print(f"   📊 UTC date filtering (WRONG method): {len(utc_filtered)} patients")
        
        # Method 2: Filter by Asia/Kolkata date (CORRECT)
        kolkata_filtered = len(today_patients)
        print(f"   📊 Asia/Kolkata date filtering (CORRECT method): {kolkata_filtered} patients")
        
        if len(utc_filtered) != kolkata_filtered:
            print("   🚨 TIMEZONE BUG CONFIRMED: Different results between UTC and Asia/Kolkata filtering!")
            print(f"      UTC filtering: {len(utc_filtered)} patients")
            print(f"      Kolkata filtering: {kolkata_filtered} patients")
            print("   💡 SOLUTION: Frontend should filter by Asia/Kolkata timezone, not UTC")
        else:
            print("   ✅ No timezone filtering discrepancy detected")
            
        # Test 4: Check if our newly created patient appears in today's log
        print("\n🎯 Test 4: Verify newly created patient appears in today's log")
        
        new_patient_in_today = any(p['id'] == patient_response.get('id') for p in today_patients)
        
        if new_patient_in_today:
            print("   ✅ Newly created patient appears in today's log")
        else:
            print("   ❌ Newly created patient NOT in today's log")
            print(f"   🔍 Looking for patient ID: {patient_response.get('id')}")
            print(f"   🔍 Today's patient IDs: {[p['id'] for p in today_patients]}")
            
            # Check if the patient exists in all patients but not in today's list
            all_patient_ids = [p.get('id') for p in all_patients]
            if patient_response.get('id') in all_patient_ids:
                print("   ✅ Patient exists in all patients list")
                # Find the patient and check its timestamp
                for patient in all_patients:
                    if patient.get('id') == patient_response.get('id'):
                        patient_created_at = patient.get('created_at')
                        print(f"   📅 Patient created_at: {patient_created_at}")
                        
                        try:
                            if patient_created_at.endswith('Z'):
                                patient_utc = datetime.fromisoformat(patient_created_at.replace('Z', '+00:00'))
                            else:
                                patient_utc = datetime.fromisoformat(patient_created_at).replace(tzinfo=timezone.utc)
                            
                            patient_kolkata = patient_utc.astimezone(kolkata_tz)
                            patient_date_kolkata = patient_kolkata.date()
                            
                            print(f"   🇮🇳 Patient date in Kolkata: {patient_date_kolkata}")
                            print(f"   📅 Current date in Kolkata: {current_date_kolkata}")
                            
                            if patient_date_kolkata == current_date_kolkata:
                                print("   ✅ Patient was created today - adding to today's list")
                                today_patients.append({
                                    'name': patient.get('patient_name'),
                                    'id': patient.get('id'),
                                    'created_at_utc': patient_utc,
                                    'created_at_kolkata': patient_kolkata,
                                    'opd_number': patient.get('opd_number')
                                })
                                new_patient_in_today = True
                            else:
                                print("   ❌ Patient was NOT created today")
                        except Exception as e:
                            print(f"   ❌ Error parsing patient timestamp: {e}")
                        break
            else:
                print("   ❌ Patient not found in all patients list - serious bug!")
                return False
            
        # Summary and diagnosis
        print("\n" + "=" * 70)
        print("🔍 BUG DIAGNOSIS SUMMARY:")
        print(f"   • Total patients in system: {len(all_patients)}")
        print(f"   • Patients created today (Asia/Kolkata): {len(today_patients)}")
        print(f"   • Patients created today (UTC): {len(utc_filtered)}")
        print(f"   • Newly created patient in today's log: {'✅' if new_patient_in_today else '❌'}")
        print(f"   • Timezone issues detected: {'✅' if timezone_issues else '❌'}")
        
        if not new_patient_in_today or timezone_issues:
            print("\n🚨 CRITICAL BUG CONFIRMED:")
            print("   1. Backend stores timestamps in UTC")
            print("   2. Frontend likely filters by UTC date instead of Asia/Kolkata date")
            print("   3. This causes patients registered today to not appear in 24-hour log")
            print("\n💡 RECOMMENDED FIXES:")
            print("   1. Frontend should convert UTC timestamps to Asia/Kolkata before date comparison")
            print("   2. Or backend should store timestamps in Asia/Kolkata timezone")
            print("   3. Ensure consistent timezone handling across the application")
            return False
        else:
            print("\n✅ No critical timezone bugs detected in patient registration")
            return True

    def test_appointment_checkin_workflow(self):
        """Test the critical bug: Appointment Check-in Workflow not properly adding to 24-hour patient log"""
        print("\n🚨 CRITICAL BUG TEST #2: Appointment Check-in Workflow")
        print("Issue: When users click 'Check In' in appointments, it should:")
        print("1. Create a new patient record via POST /api/patients (using appointment data)")
        print("2. Add the patient to the 24-hour patient log")
        print("3. The appointment should change status to 'Checked In'")
        print("=" * 70)
        
        # Login as reception (who can create patients)
        if not self.test_login(role="reception"):
            print("❌ Failed to login as reception")
            return False
            
        # Get doctors first for assignment
        success, doctors_response = self.run_test(
            "Get Doctors for Appointment Assignment",
            "GET",
            "api/doctors",
            200
        )
        
        if not success or not doctors_response:
            print("❌ Failed to get doctors")
            return False
            
        doctor_id = doctors_response[0]['id']
        doctor_name = doctors_response[0]['name']
        
        print(f"✅ Using doctor: {doctor_name} (ID: {doctor_id})")
        
        # Test 1: Simulate appointment check-in with the specific test data from review request
        print("\n📝 Test 1: Simulate appointment check-in with provided test data")
        
        # This is the exact appointment data structure from the review request
        appointment_data = {
            'patientName': 'Priya Nair',
            'phoneNumber': '9876543211',
            'patientDetails': { 
                'age': 28, 
                'sex': 'Female', 
                'address': '456 Marine Drive, Ernakulam, Kerala' 
            },
            'doctorId': doctor_id,
            'appointmentType': 'Follow-up'
        }
        
        print(f"   📋 Appointment Data:")
        print(f"      Patient: {appointment_data['patientName']}")
        print(f"      Phone: {appointment_data['phoneNumber']}")
        print(f"      Age/Sex: {appointment_data['patientDetails']['age']}/{appointment_data['patientDetails']['sex']}")
        print(f"      Address: {appointment_data['patientDetails']['address']}")
        print(f"      Doctor: {doctor_name}")
        print(f"      Type: {appointment_data['appointmentType']}")
        
        # Test 2: Convert appointment data to patient data (as frontend does)
        print("\n🔄 Test 2: Convert appointment data to patient data for API call")
        
        # This mimics the conversion logic in AppointmentSchedulingEnhanced.jsx handleCheckIn function
        patient_data = {
            "patient_name": appointment_data['patientName'],
            "phone_number": appointment_data['phoneNumber'],
            "age": str(appointment_data['patientDetails']['age']),
            "dob": '',  # Not provided in appointment
            "sex": appointment_data['patientDetails']['sex'],
            "address": appointment_data['patientDetails']['address'],
            "email": '',
            "emergency_contact_name": '',
            "emergency_contact_phone": '',
            "allergies": '',
            "medical_history": '',
            "assigned_doctor": appointment_data['doctorId'],
            "visit_type": appointment_data['appointmentType'],
            "patient_rating": 0
        }
        
        print(f"   📋 Converted Patient Data for API:")
        for key, value in patient_data.items():
            print(f"      {key}: {value}")
        
        # Test 3: Call POST /api/patients to create patient from appointment check-in
        print("\n🏥 Test 3: POST /api/patients - Create patient from appointment check-in")
        
        success, patient_response = self.run_test(
            "Create Patient from Appointment Check-in",
            "POST",
            "api/patients",
            200,
            data=patient_data
        )
        
        if not success:
            print("❌ Failed to create patient from appointment check-in")
            return False
            
        created_patient_id = patient_response.get('id')
        opd_number = patient_response.get('opd_number')
        token_number = patient_response.get('token_number')
        
        print(f"   ✅ Patient created successfully:")
        print(f"      Patient ID: {created_patient_id}")
        print(f"      OPD Number: {opd_number}")
        print(f"      Token Number: {token_number}")
        print(f"      Created At: {patient_response.get('created_at')}")
        
        # Test 4: Verify patient appears in GET /api/patients (24-hour log)
        print("\n📊 Test 4: Verify patient appears in 24-hour patient log")
        
        success, all_patients = self.run_test(
            "Get All Patients (24-hour log)",
            "GET",
            "api/patients",
            200
        )
        
        if not success:
            print("❌ Failed to get patients list")
            return False
            
        # Find our checked-in patient
        checked_in_patient = None
        for patient in all_patients:
            if patient.get('id') == created_patient_id:
                checked_in_patient = patient
                break
                
        if not checked_in_patient:
            print(f"❌ Checked-in patient {created_patient_id} not found in patients list")
            return False
            
        print(f"   ✅ Checked-in patient found in 24-hour log:")
        print(f"      Name: {checked_in_patient.get('patient_name')}")
        print(f"      Phone: {checked_in_patient.get('phone_number')}")
        print(f"      OPD: {checked_in_patient.get('opd_number')}")
        print(f"      Token: {checked_in_patient.get('token_number')}")
        print(f"      Doctor: {checked_in_patient.get('assigned_doctor')}")
        print(f"      Visit Type: {checked_in_patient.get('visit_type')}")
        
        # Test 5: Verify data structure matches appointment data
        print("\n🔍 Test 5: Verify patient data matches original appointment data")
        
        data_matches = True
        mismatches = []
        
        # Check key fields
        if checked_in_patient.get('patient_name') != appointment_data['patientName']:
            data_matches = False
            mismatches.append(f"Name: expected '{appointment_data['patientName']}', got '{checked_in_patient.get('patient_name')}'")
            
        if checked_in_patient.get('phone_number') != appointment_data['phoneNumber']:
            data_matches = False
            mismatches.append(f"Phone: expected '{appointment_data['phoneNumber']}', got '{checked_in_patient.get('phone_number')}'")
            
        if str(checked_in_patient.get('age')) != str(appointment_data['patientDetails']['age']):
            data_matches = False
            mismatches.append(f"Age: expected '{appointment_data['patientDetails']['age']}', got '{checked_in_patient.get('age')}'")
            
        if checked_in_patient.get('sex') != appointment_data['patientDetails']['sex']:
            data_matches = False
            mismatches.append(f"Sex: expected '{appointment_data['patientDetails']['sex']}', got '{checked_in_patient.get('sex')}'")
            
        if checked_in_patient.get('address') != appointment_data['patientDetails']['address']:
            data_matches = False
            mismatches.append(f"Address: expected '{appointment_data['patientDetails']['address']}', got '{checked_in_patient.get('address')}'")
            
        if checked_in_patient.get('assigned_doctor') != appointment_data['doctorId']:
            data_matches = False
            mismatches.append(f"Doctor: expected '{appointment_data['doctorId']}', got '{checked_in_patient.get('assigned_doctor')}'")
            
        if checked_in_patient.get('visit_type') != appointment_data['appointmentType']:
            data_matches = False
            mismatches.append(f"Visit Type: expected '{appointment_data['appointmentType']}', got '{checked_in_patient.get('visit_type')}'")
        
        if data_matches:
            print("   ✅ All appointment data correctly transferred to patient record")
        else:
            print("   ❌ Data mismatches found:")
            for mismatch in mismatches:
                print(f"      • {mismatch}")
                
        # Test 6: Check if patient appears in today's filtered list (timezone test)
        print("\n🕐 Test 6: Check if patient appears in today's filtered list (timezone test)")
        
        from datetime import datetime, timezone
        import pytz
        
        # Get current time in Asia/Kolkata timezone
        kolkata_tz = pytz.timezone('Asia/Kolkata')
        current_time_kolkata = datetime.now(kolkata_tz)
        current_date_kolkata = current_time_kolkata.date()
        
        # Filter today's patients
        today_patients = []
        for patient in all_patients:
            patient_created_at = patient.get('created_at')
            if patient_created_at:
                try:
                    if patient_created_at.endswith('Z'):
                        patient_utc = datetime.fromisoformat(patient_created_at.replace('Z', '+00:00'))
                    elif '+' in patient_created_at:
                        patient_utc = datetime.fromisoformat(patient_created_at)
                    else:
                        patient_utc = datetime.fromisoformat(patient_created_at).replace(tzinfo=timezone.utc)
                        
                    patient_kolkata = patient_utc.astimezone(kolkata_tz)
                    patient_date_kolkata = patient_kolkata.date()
                    
                    if patient_date_kolkata == current_date_kolkata:
                        today_patients.append(patient)
                except:
                    pass
                    
        checked_in_patient_in_today = any(p.get('id') == created_patient_id for p in today_patients)
        
        if checked_in_patient_in_today:
            print(f"   ✅ Checked-in patient appears in today's filtered list ({len(today_patients)} total today)")
        else:
            print(f"   ❌ Checked-in patient NOT in today's filtered list")
            print(f"   📊 Today's patients: {len(today_patients)}")
            print(f"   🔍 Looking for patient ID: {created_patient_id}")
            
        # Test 7: Test the complete workflow simulation
        print("\n🔄 Test 7: Complete appointment check-in workflow simulation")
        
        workflow_success = True
        workflow_issues = []
        
        # Step 1: Patient creation ✅ (already tested above)
        if not success:
            workflow_success = False
            workflow_issues.append("Patient creation via POST /api/patients failed")
            
        # Step 2: Patient added to 24-hour log ✅ (already tested above)
        if not checked_in_patient:
            workflow_success = False
            workflow_issues.append("Patient not found in 24-hour patient log")
            
        # Step 3: Data integrity ✅ (already tested above)
        if not data_matches:
            workflow_success = False
            workflow_issues.append("Appointment data not correctly transferred to patient record")
            
        # Step 4: Timezone handling ✅ (already tested above)
        if not checked_in_patient_in_today:
            workflow_success = False
            workflow_issues.append("Patient not appearing in today's filtered list (timezone issue)")
            
        # Step 5: OPD and Token generation ✅
        if not opd_number or not token_number:
            workflow_success = False
            workflow_issues.append("OPD or Token number not generated")
            
        print("\n" + "=" * 70)
        print("🔍 APPOINTMENT CHECK-IN WORKFLOW ANALYSIS:")
        print(f"   • Patient creation via POST /api/patients: {'✅' if success else '❌'}")
        print(f"   • Patient added to 24-hour log: {'✅' if checked_in_patient else '❌'}")
        print(f"   • Data integrity (appointment → patient): {'✅' if data_matches else '❌'}")
        print(f"   • Timezone handling (today's list): {'✅' if checked_in_patient_in_today else '❌'}")
        print(f"   • OPD/Token generation: {'✅' if opd_number and token_number else '❌'}")
        
        if workflow_success:
            print("\n✅ APPOINTMENT CHECK-IN WORKFLOW WORKING CORRECTLY")
            print("   The backend API properly handles appointment check-in data conversion")
            print("   Patients from appointment check-in appear in 24-hour patient log")
            print("   All data fields are correctly transferred and stored")
        else:
            print("\n❌ APPOINTMENT CHECK-IN WORKFLOW ISSUES DETECTED:")
            for issue in workflow_issues:
                print(f"   • {issue}")
                
        # Test 8: Check for missing appointment persistence (the real issue)
        print("\n🚨 Test 8: Check for appointment persistence issue")
        
        # Try to find appointment APIs
        appointment_apis_exist = False
        
        # Test if there are appointment endpoints
        appointment_endpoints_to_test = [
            "api/appointments",
            "api/appointment",
            "api/appointments/today",
            "api/schedule/appointments"
        ]
        
        print("   🔍 Testing for appointment API endpoints:")
        for endpoint in appointment_endpoints_to_test:
            success, response = self.run_test(
                f"Test {endpoint}",
                "GET",
                endpoint,
                200  # We expect 200 if endpoint exists
            )
            if success:
                appointment_apis_exist = True
                print(f"      ✅ {endpoint} exists")
            else:
                print(f"      ❌ {endpoint} not found")
                
        if not appointment_apis_exist:
            print("\n🚨 CRITICAL ISSUE IDENTIFIED:")
            print("   • No appointment APIs found in backend")
            print("   • Appointments are only stored in frontend local state")
            print("   • Appointment status changes (like 'Checked In') are not persisted")
            print("   • On page refresh, appointment status reverts to original state")
            print("\n💡 ROOT CAUSE:")
            print("   • Frontend handles appointment check-in correctly (creates patient)")
            print("   • But appointment status change is only in local React state")
            print("   • Backend needs appointment APIs to persist appointment data")
            
        return workflow_success and not appointment_apis_exist  # Return True if patient workflow works but appointments aren't persisted

def main():
    print("🏥 Starting Critical Bug Test #2: Appointment Check-in Workflow")
    print("🎯 Focus: Appointment check-in not properly adding to 24-hour patient log")
    print("🚨 Issue: When users click 'Check In', should create patient and update appointment status")
    print("=" * 70)
    
    # Get backend URL from frontend .env file
    backend_url = "http://localhost:8001"  # Default from frontend/.env VITE_BACKEND_URL
    
    # Initialize tester with correct backend URL
    tester = UnicareEHRTester(backend_url)
    
    # Run focused tests for the critical bug
    tests = [
        # Basic connectivity
        tester.test_health_check,
        
        # Create test users if needed
        tester.test_create_test_users,
        
        # Main focus: Critical bug #2 testing
        tester.test_appointment_checkin_workflow,
    ]
    
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
            import traceback
            traceback.print_exc()
    
    # Print final results
    print("\n" + "=" * 70)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
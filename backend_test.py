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

def main():
    print("🏥 Starting Comprehensive Unicare EHR Backend API Tests")
    print("🎯 Focus: Patient Registration API (POST /api/patients) Testing")
    print("=" * 60)
    
    # Initialize tester with correct backend URL
    tester = UnicareEHRTester("http://localhost:8001")
    
    # Run focused patient registration tests as per review request
    tests = [
        # Basic connectivity and auth tests
        tester.test_health_check,
        tester.test_login,  # Login as admin first
        
        # Create test users if needed
        tester.test_create_test_users,
        
        # Main focus: Patient Registration Workflow Testing
        tester.test_patient_registration_workflow,
        
        # Additional verification tests
        tester.test_role_based_access_control,
        tester.test_unauthorized_access,
    ]
    
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
            import traceback
            traceback.print_exc()
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
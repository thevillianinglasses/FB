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
        """Test creating a new patient"""
        patient_data = {
            "patient_name": "Test Patient",
            "age": "30",
            "dob": "1994-01-01",
            "sex": "Male",
            "address": "123 Test Street",
            "phone_number": "1234567890"
        }
        
        success, response = self.run_test(
            "Create Patient",
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

def main():
    print("🏥 Starting Unicare EHR Backend API Tests")
    print("=" * 50)
    
    # Initialize tester
    tester = UnicareEHRTester()
    
    # Run all tests
    tests = [
        tester.test_health_check,
        tester.test_invalid_login,
        tester.test_login,
        tester.test_unauthorized_access,
        tester.test_get_doctors,
        tester.test_create_patient,
        tester.test_get_patients,
        tester.test_get_patient_by_id,
        tester.test_update_patient,
        tester.test_delete_patient,
    ]
    
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
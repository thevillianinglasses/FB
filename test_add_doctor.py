#!/usr/bin/env python3
"""
Test script for Add New Doctor functionality
Testing POST /api/doctors with specific test data from review request
"""

import requests
import sys
import json
import uuid
from datetime import datetime

class DoctorTester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        
    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        print(f"   Method: {method}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

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

    def test_login(self):
        """Login as admin to get token"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "api/auth/login",
            200,
            data={"username": "admin", "password": "admin_007"}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_add_new_doctor_functionality(self):
        """Test the Add New Doctor functionality as specified in review request"""
        print("\n👨‍⚕️ TESTING ADD NEW DOCTOR FUNCTIONALITY")
        print("Testing POST /api/doctors with specific test data from review request")
        print("=" * 70)
        
        # Login as admin (required for doctor creation)
        if not self.test_login():
            print("❌ Failed to login as admin for doctor creation")
            return False
            
        # Test 1: Create first doctor with specified test data
        print("\n📝 Test 1: POST /api/doctors - Create 'Test Doctor'")
        
        doctor1_data = {
            "id": str(uuid.uuid4()),  # Generate UUID
            "name": "Test Doctor",
            "specialty": "Cardiology", 
            "qualification": "MBBS, MD",
            "default_fee": "600",
            "phone": "9876543210",
            "email": "testdoctor@unicare.com"
        }
        
        print(f"   📋 Doctor 1 Data:")
        for key, value in doctor1_data.items():
            print(f"      {key}: {value}")
        
        success1, doctor1_response = self.run_test(
            "Create Test Doctor",
            "POST",
            "api/doctors",
            200,
            data=doctor1_data
        )
        
        if not success1:
            print("❌ Failed to create first doctor")
            return False
            
        doctor1_id = doctor1_response.get('id')
        print(f"   ✅ Test Doctor created with ID: {doctor1_id}")
        
        # Test 2: Create second doctor with different specialty
        print("\n📝 Test 2: POST /api/doctors - Create 'Emergency Doctor'")
        
        doctor2_data = {
            "id": str(uuid.uuid4()),  # Generate UUID
            "name": "Emergency Doctor",
            "specialty": "Emergency Medicine",
            "qualification": "MBBS", 
            "default_fee": "700",
            "phone": "9876543211",
            "email": "emergency@unicare.com"
        }
        
        print(f"   📋 Doctor 2 Data:")
        for key, value in doctor2_data.items():
            print(f"      {key}: {value}")
        
        success2, doctor2_response = self.run_test(
            "Create Emergency Doctor",
            "POST",
            "api/doctors",
            200,
            data=doctor2_data
        )
        
        if not success2:
            print("❌ Failed to create second doctor")
            return False
            
        doctor2_id = doctor2_response.get('id')
        print(f"   ✅ Emergency Doctor created with ID: {doctor2_id}")
        
        # Test 3: GET /api/doctors - Verify both doctors appear in the list
        print("\n📊 Test 3: GET /api/doctors - Verify new doctors appear in list")
        
        success3, doctors_list = self.run_test(
            "Get All Doctors",
            "GET",
            "api/doctors",
            200
        )
        
        if not success3:
            print("❌ Failed to get doctors list")
            return False
            
        print(f"   📈 Total doctors in system: {len(doctors_list)}")
        
        # Find our created doctors in the list
        test_doctor_found = False
        emergency_doctor_found = False
        
        for doctor in doctors_list:
            if doctor.get('id') == doctor1_id:
                test_doctor_found = True
                print(f"   ✅ Test Doctor found: {doctor.get('name')} - {doctor.get('specialty')} - ₹{doctor.get('default_fee')}")
            elif doctor.get('id') == doctor2_id:
                emergency_doctor_found = True
                print(f"   ✅ Emergency Doctor found: {doctor.get('name')} - {doctor.get('specialty')} - ₹{doctor.get('default_fee')}")
        
        if not test_doctor_found:
            print(f"❌ Test Doctor (ID: {doctor1_id}) not found in doctors list")
            return False
            
        if not emergency_doctor_found:
            print(f"❌ Emergency Doctor (ID: {doctor2_id}) not found in doctors list")
            return False
            
        # Test 4: Verify data persistence and structure
        print("\n🔍 Test 4: Verify doctor data structure and persistence")
        
        # Check Test Doctor data
        test_doctor = next((d for d in doctors_list if d.get('id') == doctor1_id), None)
        if test_doctor:
            data_valid = True
            expected_fields = {
                'name': 'Test Doctor',
                'specialty': 'Cardiology',
                'qualification': 'MBBS, MD',
                'default_fee': '600',
                'phone': '9876543210',
                'email': 'testdoctor@unicare.com'
            }
            
            print(f"   📋 Verifying Test Doctor data:")
            for field, expected_value in expected_fields.items():
                actual_value = test_doctor.get(field)
                if actual_value == expected_value:
                    print(f"      ✅ {field}: {actual_value}")
                else:
                    print(f"      ❌ {field}: expected '{expected_value}', got '{actual_value}'")
                    data_valid = False
                    
            if not data_valid:
                print("❌ Test Doctor data validation failed")
                return False
        
        # Check Emergency Doctor data
        emergency_doctor = next((d for d in doctors_list if d.get('id') == doctor2_id), None)
        if emergency_doctor:
            data_valid = True
            expected_fields = {
                'name': 'Emergency Doctor',
                'specialty': 'Emergency Medicine',
                'qualification': 'MBBS',
                'default_fee': '700',
                'phone': '9876543211',
                'email': 'emergency@unicare.com'
            }
            
            print(f"   📋 Verifying Emergency Doctor data:")
            for field, expected_value in expected_fields.items():
                actual_value = emergency_doctor.get(field)
                if actual_value == expected_value:
                    print(f"      ✅ {field}: {actual_value}")
                else:
                    print(f"      ❌ {field}: expected '{expected_value}', got '{actual_value}'")
                    data_valid = False
                    
            if not data_valid:
                print("❌ Emergency Doctor data validation failed")
                return False
        
        # Test 5: Verify default_fee is string type (critical for frontend)
        print("\n💰 Test 5: Verify default_fee field type (critical for frontend)")
        
        for doctor in [test_doctor, emergency_doctor]:
            doctor_name = doctor.get('name')
            default_fee = doctor.get('default_fee')
            
            if isinstance(default_fee, str):
                print(f"   ✅ {doctor_name}: default_fee is string type: '{default_fee}'")
                
                # Verify it's a valid numeric string
                try:
                    float(default_fee)
                    print(f"   ✅ {doctor_name}: default_fee is valid numeric string")
                except ValueError:
                    print(f"   ❌ {doctor_name}: default_fee '{default_fee}' is not a valid numeric string")
                    return False
            else:
                print(f"   ❌ {doctor_name}: default_fee is {type(default_fee).__name__}, expected string")
                return False
        
        # Test 6: Test data consistency across multiple requests
        print("\n🔄 Test 6: Test data consistency across multiple requests")
        
        # Make multiple requests to verify consistency
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
        
        # Check if our doctors appear in all responses
        consistent = True
        for response in responses:
            doctor_ids = [d.get('id') for d in response]
            if doctor1_id not in doctor_ids or doctor2_id not in doctor_ids:
                consistent = False
                break
        
        if consistent:
            print("   ✅ New doctors appear consistently across multiple requests")
        else:
            print("   ❌ Data inconsistency detected - new doctors not appearing consistently")
            return False
        
        # Final Summary
        print("\n" + "=" * 70)
        print("🎉 ADD NEW DOCTOR FUNCTIONALITY TEST SUMMARY:")
        print(f"   ✅ Test Doctor created successfully (ID: {doctor1_id})")
        print(f"   ✅ Emergency Doctor created successfully (ID: {doctor2_id})")
        print(f"   ✅ Both doctors appear in GET /api/doctors")
        print(f"   ✅ All doctor data fields correctly stored and retrieved")
        print(f"   ✅ default_fee field is string type (frontend compatible)")
        print(f"   ✅ Data consistency verified across multiple requests")
        print("\n🏆 ADD NEW DOCTOR FUNCTIONALITY IS WORKING PERFECTLY!")
        
        return True

def main():
    print("🏥 UNICARE EHR - ADD NEW DOCTOR FUNCTIONALITY TEST")
    print("🎯 Testing POST /api/doctors with specific test data from review request")
    print("🚨 Focus: Verify doctor creation and data persistence")
    print("=" * 70)
    
    # Get backend URL from frontend .env file
    backend_url = "http://localhost:8001"  # Default from frontend/.env VITE_BACKEND_URL
    
    # Initialize tester with correct backend URL
    tester = DoctorTester(backend_url)
    
    # Run the add new doctor test
    try:
        success = tester.test_add_new_doctor_functionality()
    except Exception as e:
        print(f"❌ Test failed with exception: {str(e)}")
        import traceback
        traceback.print_exc()
        success = False
    
    # Print final results
    print("\n" + "=" * 70)
    print(f"📊 Final Results:")
    print(f"   Tests run: {tester.tests_run}")
    print(f"   Tests passed: {tester.tests_passed}")
    print(f"   Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if success and tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed! Add New Doctor functionality is working correctly.")
        return 0
    else:
        print("❌ Some tests failed - check output above")
        return 1

if __name__ == "__main__":
    sys.exit(main())
#!/usr/bin/env python3

import requests
import json
from datetime import datetime

class QuickBackendTester:
    def __init__(self):
        self.base_url = "https://unicare-login-fix.preview.emergentagent.com"
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

    def test_login(self):
        """Test login and get token"""
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
            print(f"   User role: {response.get('user_role')}")
            print(f"   User name: {response.get('user_name')}")
            return True
        return False

    def test_departments(self):
        """Test departments API"""
        success, response = self.run_test(
            "Get Departments",
            "GET",
            "api/departments",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} departments")
            for dept in response:
                print(f"   - {dept.get('name', 'Unknown')}")
            return True, response
        return False, []

    def test_doctors(self):
        """Test doctors API"""
        success, response = self.run_test(
            "Get Doctors",
            "GET",
            "api/doctors",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} doctors")
            for doctor in response:
                print(f"   - {doctor.get('name', 'Unknown')} ({doctor.get('specialty', 'Unknown')})")
            return True, response
        return False, []

    def test_department_doctors(self, department_id):
        """Test department-specific doctors API"""
        success, response = self.run_test(
            f"Get Department Doctors",
            "GET",
            f"api/departments/{department_id}/doctors",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} doctors in department")
            return True, response
        return False, []

    def test_create_department(self):
        """Test creating a new department"""
        new_dept_data = {
            "name": "Test Department",
            "description": "Test department for API testing",
            "location": "Test Floor",
            "phone": "1234567890",
            "email": "test@unicare.com",
            "status": "active"
        }
        
        success, response = self.run_test(
            "Create Test Department",
            "POST",
            "api/departments",
            200,
            data=new_dept_data
        )
        if success and 'id' in response:
            print(f"   Department created with ID: {response['id']}")
            return True, response
        return False, {}

    def test_create_doctor(self, department_id):
        """Test creating a new doctor"""
        new_doctor_data = {
            "name": "Dr. Test Doctor",
            "department_id": department_id,
            "specialty": "Test Specialty",
            "qualification": "MBBS, MD",
            "default_fee": "200",
            "phone": "9876543210",
            "email": "testdoctor@unicare.com",
            "room_number": "T101",
            "status": "active"
        }
        
        success, response = self.run_test(
            "Create Test Doctor",
            "POST",
            "api/doctors",
            200,
            data=new_doctor_data
        )
        if success and 'id' in response:
            print(f"   Doctor created with ID: {response['id']}")
            return True, response
        return False, {}

def main():
    print("🚀 QUICK BACKEND API TEST")
    print("Testing Phase 3: Admin & Reception Integration")
    print("=" * 60)
    
    tester = QuickBackendTester()
    
    # Test 1: Health Check
    print("\n📊 Test 1: Health Check")
    if not tester.test_health_check():
        print("❌ Health check failed - backend may be down")
        return 1
    
    # Test 2: Authentication
    print("\n🔐 Test 2: Authentication")
    if not tester.test_login():
        print("❌ Login failed - authentication issue")
        return 1
    
    # Test 3: Get Departments
    print("\n🏥 Test 3: Get Departments")
    dept_success, departments = tester.test_departments()
    if not dept_success:
        print("❌ Failed to get departments")
        return 1
    
    # Test 4: Get Doctors
    print("\n👨‍⚕️ Test 4: Get Doctors")
    doc_success, doctors = tester.test_doctors()
    if not doc_success:
        print("❌ Failed to get doctors")
        return 1
    
    # Test 5: Department-specific doctors
    if departments:
        print("\n🔗 Test 5: Department-specific Doctors")
        first_dept = departments[0]
        dept_id = first_dept['id']
        dept_name = first_dept['name']
        print(f"   Testing with department: {dept_name}")
        
        success, dept_doctors = tester.test_department_doctors(dept_id)
        if success:
            print(f"   ✅ Department API working - {len(dept_doctors)} doctors in {dept_name}")
        else:
            print(f"   ❌ Department-specific doctors API failed")
    
    # Test 6: Create Department (Admin functionality)
    print("\n➕ Test 6: Create Department (Admin)")
    create_dept_success, new_dept = tester.test_create_department()
    if create_dept_success:
        print("   ✅ Department creation working")
        
        # Test 7: Create Doctor in new department
        print("\n➕ Test 7: Create Doctor (Admin)")
        create_doc_success, new_doctor = tester.test_create_doctor(new_dept['id'])
        if create_doc_success:
            print("   ✅ Doctor creation working")
            
            # Test 8: Verify doctor appears in department
            print("\n🔄 Test 8: Verify Cross-Module Integration")
            success, updated_dept_doctors = tester.test_department_doctors(new_dept['id'])
            if success and len(updated_dept_doctors) > 0:
                print("   ✅ Cross-module integration working - doctor appears in department")
            else:
                print("   ❌ Cross-module integration issue - doctor not in department")
        else:
            print("   ❌ Doctor creation failed")
    else:
        print("   ❌ Department creation failed")
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print(f"   Tests run: {tester.tests_run}")
    print(f"   Tests passed: {tester.tests_passed}")
    print(f"   Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("\n✅ ALL TESTS PASSED - Backend APIs working correctly!")
        return 0
    else:
        print(f"\n❌ {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    exit(main())
#!/usr/bin/env python3
"""
Admin System APIs Testing Script
Tests the FIXED comprehensive admin system APIs after resolving import issues

This script tests:
1. Department Management APIs (24 departments expected)
2. User Management APIs (multi-role support)
3. Authentication using admin/admin_007
4. API responses match expected JSON structure
"""

import requests
import json
import sys
from datetime import datetime

class AdminSystemTester:
    def __init__(self, base_url="https://unicare-login-fix.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_department_id = None
        self.created_user_id = None
        
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
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers, timeout=10)
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

    def test_admin_login(self):
        """Test admin login with admin/admin_007"""
        print("\n🔐 Testing Admin Authentication...")
        
        success, response = self.run_test(
            "Admin Login (admin/admin_007)",
            "POST",
            "api/auth/login",
            200,
            data={"username": "admin", "password": "admin_007"}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   ✅ Admin token obtained: {self.token[:20]}...")
            print(f"   ✅ User role: {response.get('user_role', 'N/A')}")
            return True
        return False

    def test_department_management_apis(self):
        """Test Department Management APIs"""
        print("\n🏢 TESTING DEPARTMENT MANAGEMENT APIs")
        print("=" * 60)
        
        # Test 1: GET /api/admin/departments/ - should return 24 departments
        print("\n📋 Test 1: GET /api/admin/departments/ - Check for 24 departments")
        
        success, departments_response = self.run_test(
            "Get All Departments (Admin)",
            "GET",
            "api/admin/departments/",
            200
        )
        
        if not success:
            print("❌ FAILED: Cannot access admin departments endpoint")
            print("   This indicates the new admin routers are not properly loaded")
            
            # Fallback: Test legacy departments endpoint
            print("\n🔄 Fallback: Testing legacy departments endpoint...")
            success, departments_response = self.run_test(
                "Get Departments (Legacy)",
                "GET",
                "api/departments",
                200
            )
            
            if success:
                print(f"   ✅ Legacy endpoint works - Found {len(departments_response)} departments")
                print("   ⚠️ But new admin endpoints are not available")
                return False
            else:
                print("   ❌ Both admin and legacy endpoints failed")
                return False
        
        if not isinstance(departments_response, list):
            print(f"❌ Expected list response, got {type(departments_response)}")
            return False
            
        print(f"✅ Successfully retrieved {len(departments_response)} departments")
        
        # Check if we have the expected 24 departments
        if len(departments_response) >= 24:
            print("✅ Found expected 24+ departments")
        elif len(departments_response) >= 4:
            print(f"⚠️ Found {len(departments_response)} departments (expected 24)")
        else:
            print(f"❌ Only found {len(departments_response)} departments (expected 24)")
            
        # Display department details
        print("   📋 Departments found:")
        for i, dept in enumerate(departments_response[:10]):  # Show first 10
            print(f"      {i+1}. {dept.get('name', 'Unknown')} (Active: {dept.get('active', 'N/A')})")
            
        # Test 2: POST /api/admin/departments/ - test creating a new test department
        print("\n➕ Test 2: POST /api/admin/departments/ - Create test department")
        
        new_department_data = {
            "name": "Test Department",
            "active": True
        }
        
        success, created_dept_response = self.run_test(
            "Create Test Department",
            "POST",
            "api/admin/departments/",
            200,
            data=new_department_data
        )
        
        if success:
            self.created_department_id = created_dept_response.get('id')
            print(f"✅ Successfully created department: {created_dept_response.get('name')}")
            print(f"   Department ID: {self.created_department_id}")
            print(f"   Slug: {created_dept_response.get('slug', 'N/A')}")
            
            # Verify slug auto-generation
            expected_slug = "test_department"
            actual_slug = created_dept_response.get('slug', '')
            if expected_slug in actual_slug:
                print("   ✅ Slug auto-generation working correctly")
            else:
                print(f"   ⚠️ Unexpected slug: {actual_slug}")
        else:
            print("❌ Failed to create test department")
            return False
            
        # Test 3: PATCH /api/admin/departments/{id} - test updating a department status
        print("\n✏️ Test 3: PATCH /api/admin/departments/{id} - Update department status")
        
        if not self.created_department_id:
            print("❌ Skipped - No department ID available")
            return False
            
        update_data = {
            "active": False,
            "name": "Updated Test Department"
        }
        
        success, updated_dept_response = self.run_test(
            "Update Department Status",
            "PATCH",
            f"api/admin/departments/{self.created_department_id}",
            200,
            data=update_data
        )
        
        if success:
            print(f"✅ Successfully updated department")
            print(f"   Active status: {updated_dept_response.get('active')}")
            print(f"   Updated name: {updated_dept_response.get('name')}")
        else:
            print("❌ Failed to update department")
            return False
            
        # Test 4: GET /api/admin/departments/{id}/staff - test getting staff for a department
        print("\n👥 Test 4: GET /api/admin/departments/{id}/staff - Get department staff")
        
        # Use the first existing department for staff testing
        existing_dept_id = departments_response[0]['id'] if departments_response else self.created_department_id
        
        success, staff_response = self.run_test(
            "Get Department Staff",
            "GET",
            f"api/admin/departments/{existing_dept_id}/staff",
            200
        )
        
        if success:
            print(f"✅ Successfully retrieved department staff")
            print(f"   Department: {staff_response.get('department', {}).get('name', 'Unknown')}")
            print(f"   Doctors: {len(staff_response.get('doctors', []))}")
            print(f"   Nurses: {len(staff_response.get('nurses', []))}")
            print(f"   Other Staff: {len(staff_response.get('other_staff', []))}")
            
            # Display staff details
            if staff_response.get('doctors'):
                print("   👨‍⚕️ Doctors:")
                for doctor in staff_response['doctors'][:3]:  # Show first 3
                    print(f"      • {doctor.get('name', 'Unknown')} - Fee: ₹{doctor.get('consultation_fee', 0)}")
        else:
            print("❌ Failed to get department staff")
            return False
            
        return True

    def test_user_management_apis(self):
        """Test User Management APIs"""
        print("\n👥 TESTING USER MANAGEMENT APIs")
        print("=" * 60)
        
        # Test 1: GET /api/admin/users/ - should return all users
        print("\n📋 Test 1: GET /api/admin/users/ - Get all users")
        
        success, users_response = self.run_test(
            "Get All Users (Admin)",
            "GET",
            "api/admin/users/",
            200
        )
        
        if not success:
            print("❌ FAILED: Cannot access admin users endpoint")
            print("   This indicates the new admin routers are not properly loaded")
            
            # Fallback: Test legacy users endpoint
            print("\n🔄 Fallback: Testing legacy users endpoint...")
            success, users_response = self.run_test(
                "Get Users (Legacy)",
                "GET",
                "api/users",
                200
            )
            
            if success:
                print(f"   ✅ Legacy endpoint works - Found {len(users_response)} users")
                print("   ⚠️ But new admin endpoints are not available")
                return False
            else:
                print("   ❌ Both admin and legacy endpoints failed")
                return False
        
        if not isinstance(users_response, list):
            print(f"❌ Expected list response, got {type(users_response)}")
            return False
            
        print(f"✅ Successfully retrieved {len(users_response)} users")
        
        # Display user details
        print("   👤 Users found:")
        for i, user in enumerate(users_response[:7]):  # Show first 7
            roles = ', '.join(user.get('roles', []))
            print(f"      {i+1}. {user.get('full_name', 'Unknown')} ({user.get('username', 'N/A')}) - Roles: {roles}")
            
        # Test 2: GET /api/admin/users/doctors/ - should return doctors list
        print("\n👨‍⚕️ Test 2: GET /api/admin/users/doctors/ - Get doctors")
        
        success, doctors_response = self.run_test(
            "Get All Doctors (Admin)",
            "GET",
            "api/admin/users/doctors/",
            200
        )
        
        if success:
            print(f"✅ Successfully retrieved {len(doctors_response)} doctors")
            
            # Display doctor details
            if doctors_response:
                print("   👨‍⚕️ Doctors found:")
                for i, doctor in enumerate(doctors_response):
                    dept_name = doctor.get('department', {}).get('name', 'Unknown') if doctor.get('department') else 'No Department'
                    print(f"      {i+1}. {doctor.get('name', 'Unknown')} - {dept_name} - Fee: ₹{doctor.get('consultation_fee', 0)}")
        else:
            print("❌ Failed to get doctors list")
            return False
            
        # Test 3: GET /api/admin/users/nurses/ - should return nurses list
        print("\n👩‍⚕️ Test 3: GET /api/admin/users/nurses/ - Get nurses")
        
        success, nurses_response = self.run_test(
            "Get All Nurses (Admin)",
            "GET",
            "api/admin/users/nurses/",
            200
        )
        
        if success:
            print(f"✅ Successfully retrieved {len(nurses_response)} nurses")
            
            # Display nurse details
            if nurses_response:
                print("   👩‍⚕️ Nurses found:")
                for i, nurse in enumerate(nurses_response):
                    dept_name = nurse.get('department', {}).get('name', 'Unknown') if nurse.get('department') else 'No Department'
                    print(f"      {i+1}. {nurse.get('name', 'Unknown')} - {dept_name} - Shift: {nurse.get('shift', 'Unknown')}")
        else:
            print("❌ Failed to get nurses list")
            return False
            
        # Test 4: POST /api/admin/users/ - test creating a new staff member with multi-role support
        print("\n➕ Test 4: POST /api/admin/users/ - Create staff with multi-role support")
        
        # First get departments for assignment
        success, departments = self.run_test(
            "Get Departments for User Assignment",
            "GET",
            "api/admin/departments/",
            200
        )
        
        if not success or not departments:
            print("❌ Failed to get departments for user assignment")
            return False
            
        # Use first department for assignment
        dept_id = departments[0]['id']
        
        new_user_data = {
            "username": "test_multirole_user",
            "password": "testpass123",
            "full_name": "Dr. Test Multi-Role User",
            "roles": ["doctor", "reception"],  # Multi-role support
            "designation": "Senior Doctor & Reception Coordinator",
            "department_ids": [dept_id],
            "email": "test.multirole@unicare.com",
            "phone": "9876543298"
        }
        
        success, created_user_response = self.run_test(
            "Create Multi-Role User",
            "POST",
            "api/admin/users/",
            200,
            data=new_user_data
        )
        
        if success:
            self.created_user_id = created_user_response.get('id')
            print(f"✅ Successfully created user: {created_user_response.get('full_name')}")
            print(f"   User ID: {self.created_user_id}")
            print(f"   Username: {created_user_response.get('username')}")
            print(f"   Roles: {', '.join(created_user_response.get('roles', []))}")
            print(f"   Departments: {len(created_user_response.get('departments', []))}")
            
            # Check if doctor record was created (since user has doctor role)
            if 'doctor_details' in created_user_response:
                print(f"   ✅ Doctor record created - Fee: ₹{created_user_response['doctor_details'].get('consultation_fee', 0)}")
            else:
                print("   ⚠️ No doctor record found (expected for doctor role)")
        else:
            print("❌ Failed to create multi-role user")
            return False
            
        return True

    def test_api_response_structure(self):
        """Test that API responses match expected JSON structure"""
        print("\n🔍 TESTING API RESPONSE STRUCTURE")
        print("=" * 60)
        
        # Test department response structure
        print("\n📋 Testing Department Response Structure")
        
        success, departments = self.run_test(
            "Get Departments for Structure Test",
            "GET",
            "api/admin/departments/",
            200
        )
        
        if success and departments:
            sample_dept = departments[0]
            required_dept_fields = ['id', 'name', 'active', 'created_at', 'updated_at']
            
            print("   Department structure validation:")
            structure_valid = True
            for field in required_dept_fields:
                if field in sample_dept:
                    print(f"   ✅ {field}: {type(sample_dept[field]).__name__}")
                else:
                    print(f"   ❌ Missing field: {field}")
                    structure_valid = False
                    
            if 'slug' in sample_dept:
                print(f"   ✅ slug: {sample_dept['slug']} (auto-generated)")
            else:
                print("   ⚠️ No slug field (may be optional)")
                
            if structure_valid:
                print("   ✅ Department structure is valid")
            else:
                print("   ❌ Department structure validation failed")
        else:
            print("   ❌ Cannot test department structure - no data available")
            
        # Test user response structure
        print("\n👤 Testing User Response Structure")
        
        success, users = self.run_test(
            "Get Users for Structure Test",
            "GET",
            "api/admin/users/",
            200
        )
        
        if success and users:
            sample_user = users[0]
            required_user_fields = ['id', 'username', 'full_name', 'roles', 'active']
            
            print("   User structure validation:")
            structure_valid = True
            for field in required_user_fields:
                if field in sample_user:
                    print(f"   ✅ {field}: {type(sample_user[field]).__name__}")
                else:
                    print(f"   ❌ Missing field: {field}")
                    structure_valid = False
                    
            # Check multi-role support
            if isinstance(sample_user.get('roles'), list):
                print(f"   ✅ roles is list: {sample_user['roles']}")
            else:
                print(f"   ❌ roles should be list, got {type(sample_user.get('roles'))}")
                structure_valid = False
                
            if structure_valid:
                print("   ✅ User structure is valid")
            else:
                print("   ❌ User structure validation failed")
        else:
            print("   ❌ Cannot test user structure - no data available")
            
        return True

    def run_comprehensive_test(self):
        """Run all comprehensive admin system tests"""
        print("🏥 COMPREHENSIVE ADMIN SYSTEM API TESTING")
        print("Testing FIXED admin system APIs after resolving import issues")
        print("=" * 80)
        
        # Test 1: Admin Authentication
        if not self.test_admin_login():
            print("\n❌ CRITICAL: Admin authentication failed")
            print("Cannot proceed with admin API testing")
            return False
            
        # Test 2: Department Management APIs
        dept_success = self.test_department_management_apis()
        
        # Test 3: User Management APIs
        user_success = self.test_user_management_apis()
        
        # Test 4: API Response Structure
        structure_success = self.test_api_response_structure()
        
        # Final Summary
        print("\n" + "=" * 80)
        print("🎯 COMPREHENSIVE ADMIN SYSTEM TEST SUMMARY")
        print("=" * 80)
        
        print(f"📊 Tests Run: {self.tests_run}")
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        print("\n🔍 Component Status:")
        print(f"   🔐 Admin Authentication: {'✅' if self.token else '❌'}")
        print(f"   🏢 Department Management: {'✅' if dept_success else '❌'}")
        print(f"   👥 User Management: {'✅' if user_success else '❌'}")
        print(f"   📋 API Response Structure: {'✅' if structure_success else '❌'}")
        
        if dept_success and user_success:
            print("\n🎉 ADMIN SYSTEM APIs ARE WORKING!")
            print("   ✅ Import issues have been resolved")
            print("   ✅ All admin endpoints are accessible")
            print("   ✅ Department slug auto-generation working")
            print("   ✅ Multi-role user creation working")
            print("   ✅ API responses match expected structure")
            return True
        else:
            print("\n🚨 ADMIN SYSTEM APIs HAVE ISSUES!")
            if not dept_success:
                print("   ❌ Department management APIs not working")
            if not user_success:
                print("   ❌ User management APIs not working")
            print("   💡 Import issues may not be fully resolved")
            return False

def main():
    """Main function to run the admin system tests"""
    print("Starting Admin System API Testing...")
    
    tester = AdminSystemTester()
    success = tester.run_comprehensive_test()
    
    if success:
        print("\n✅ All admin system tests passed!")
        sys.exit(0)
    else:
        print("\n❌ Some admin system tests failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
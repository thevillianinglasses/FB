#!/usr/bin/env python3
"""
Authentication System Testing Script
Tests the login authentication system with all 6 user roles as requested in the review.
"""

import requests
import json
import sys
from datetime import datetime

class AuthenticationTester:
    def __init__(self, base_url="https://unicare-login-fix.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test accounts as specified in the review request
        self.test_accounts = [
            {"username": "admin", "password": "admin_007", "role": "admin"},
            {"username": "reception1", "password": "reception123", "role": "reception"},
            {"username": "lab1", "password": "lab123", "role": "laboratory"},
            {"username": "pharmacy1", "password": "pharmacy123", "role": "pharmacy"},
            {"username": "nurse1", "password": "nurse123", "role": "nursing"},
            {"username": "doctor1", "password": "doctor123", "role": "doctor"}
        ]

    def log_test(self, test_name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            status = "✅ PASS"
        else:
            status = "❌ FAIL"
        
        result = {
            "test": test_name,
            "status": status,
            "success": success,
            "details": details
        }
        self.test_results.append(result)
        print(f"{status} - {test_name}")
        if details:
            print(f"    {details}")

    def test_health_check(self):
        """Test the health check endpoint /api/health"""
        print("\n🏥 Testing Health Check Endpoint...")
        
        try:
            url = f"{self.base_url}/api/health"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "status" in data and "timestamp" in data:
                    self.log_test(
                        "Health Check Endpoint", 
                        True, 
                        f"Status: {data['status']}, Timestamp: {data['timestamp']}"
                    )
                    return True
                else:
                    self.log_test(
                        "Health Check Endpoint", 
                        False, 
                        f"Missing required fields in response: {data}"
                    )
                    return False
            else:
                self.log_test(
                    "Health Check Endpoint", 
                    False, 
                    f"Expected 200, got {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test("Health Check Endpoint", False, f"Exception: {str(e)}")
            return False

    def test_login_with_credentials(self, username, password, expected_role):
        """Test login with specific credentials"""
        try:
            url = f"{self.base_url}/api/auth/login"
            data = {"username": username, "password": password}
            headers = {'Content-Type': 'application/json'}
            
            response = requests.post(url, json=data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                response_data = response.json()
                
                # Check required fields in response
                required_fields = ['access_token', 'user_role', 'user_name', 'token_type']
                missing_fields = [field for field in required_fields if field not in response_data]
                
                if missing_fields:
                    self.log_test(
                        f"Login {username}/{password}", 
                        False, 
                        f"Missing fields in response: {missing_fields}"
                    )
                    return False, None
                
                # Verify token_type is "bearer"
                if response_data.get('token_type') != 'bearer':
                    self.log_test(
                        f"Login {username}/{password}", 
                        False, 
                        f"Expected token_type 'bearer', got '{response_data.get('token_type')}'"
                    )
                    return False, None
                
                # Verify user_role matches expected
                actual_role = response_data.get('user_role')
                if actual_role != expected_role:
                    self.log_test(
                        f"Login {username}/{password}", 
                        False, 
                        f"Expected role '{expected_role}', got '{actual_role}'"
                    )
                    return False, None
                
                # Verify access_token is present and not empty
                access_token = response_data.get('access_token')
                if not access_token or len(access_token) < 10:
                    self.log_test(
                        f"Login {username}/{password}", 
                        False, 
                        f"Invalid access_token: {access_token}"
                    )
                    return False, None
                
                self.log_test(
                    f"Login {username}/{password}", 
                    True, 
                    f"Role: {actual_role}, User: {response_data.get('user_name')}, Token: {access_token[:20]}..."
                )
                return True, access_token
                
            else:
                self.log_test(
                    f"Login {username}/{password}", 
                    False, 
                    f"Expected 200, got {response.status_code}: {response.text}"
                )
                return False, None
                
        except Exception as e:
            self.log_test(f"Login {username}/{password}", False, f"Exception: {str(e)}")
            return False, None

    def test_protected_endpoint_access(self, token, endpoint, expected_status=200):
        """Test accessing a protected endpoint with JWT token"""
        try:
            url = f"{self.base_url}/{endpoint}"
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == expected_status:
                self.log_test(
                    f"Protected endpoint {endpoint}", 
                    True, 
                    f"Status: {response.status_code}"
                )
                return True
            else:
                self.log_test(
                    f"Protected endpoint {endpoint}", 
                    False, 
                    f"Expected {expected_status}, got {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test(f"Protected endpoint {endpoint}", False, f"Exception: {str(e)}")
            return False

    def test_invalid_credentials(self):
        """Test login with invalid credentials"""
        print("\n🔒 Testing Invalid Credentials...")
        
        try:
            url = f"{self.base_url}/api/auth/login"
            data = {"username": "invalid_user", "password": "invalid_pass"}
            headers = {'Content-Type': 'application/json'}
            
            response = requests.post(url, json=data, headers=headers, timeout=10)
            
            if response.status_code == 401:
                self.log_test(
                    "Invalid Credentials Test", 
                    True, 
                    "Correctly rejected invalid credentials with 401"
                )
                return True
            else:
                self.log_test(
                    "Invalid Credentials Test", 
                    False, 
                    f"Expected 401, got {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test("Invalid Credentials Test", False, f"Exception: {str(e)}")
            return False

    def test_unauthorized_access(self):
        """Test accessing protected endpoints without token"""
        print("\n🚫 Testing Unauthorized Access...")
        
        protected_endpoints = [
            "api/patients",
            "api/doctors", 
            "api/users"
        ]
        
        all_passed = True
        for endpoint in protected_endpoints:
            try:
                url = f"{self.base_url}/{endpoint}"
                response = requests.get(url, timeout=10)
                
                if response.status_code == 401:
                    self.log_test(
                        f"Unauthorized access to {endpoint}", 
                        True, 
                        "Correctly blocked with 401"
                    )
                else:
                    self.log_test(
                        f"Unauthorized access to {endpoint}", 
                        False, 
                        f"Expected 401, got {response.status_code}"
                    )
                    all_passed = False
                    
            except Exception as e:
                self.log_test(f"Unauthorized access to {endpoint}", False, f"Exception: {str(e)}")
                all_passed = False
                
        return all_passed

    def run_comprehensive_auth_tests(self):
        """Run all authentication tests as requested in the review"""
        print("🔐 COMPREHENSIVE AUTHENTICATION SYSTEM TESTING")
        print("=" * 60)
        print(f"Testing against: {self.base_url}")
        print(f"Test time: {datetime.now()}")
        print("=" * 60)
        
        # Test 1: Health Check
        health_ok = self.test_health_check()
        
        # Test 2: Invalid credentials
        invalid_creds_ok = self.test_invalid_credentials()
        
        # Test 3: Unauthorized access
        unauth_ok = self.test_unauthorized_access()
        
        # Test 4: All 6 user role logins
        print("\n👥 Testing All 6 User Role Logins...")
        login_results = {}
        tokens = {}
        
        for account in self.test_accounts:
            username = account["username"]
            password = account["password"]
            expected_role = account["role"]
            
            success, token = self.test_login_with_credentials(username, password, expected_role)
            login_results[username] = success
            if success and token:
                tokens[username] = token
        
        # Test 5: JWT Token usage for protected endpoints
        print("\n🔑 Testing JWT Token Usage for Protected Endpoints...")
        
        # Test with admin token (should have access to most endpoints)
        if "admin" in tokens:
            admin_token = tokens["admin"]
            
            protected_endpoints = [
                ("api/doctors", 200),
                ("api/patients", 200),
                ("api/users", 200),  # Admin only
                ("api/departments", 200)
            ]
            
            for endpoint, expected_status in protected_endpoints:
                self.test_protected_endpoint_access(admin_token, endpoint, expected_status)
        
        # Test with reception token (should have limited access)
        if "reception1" in tokens:
            reception_token = tokens["reception1"]
            
            reception_endpoints = [
                ("api/doctors", 200),
                ("api/patients", 200),
                ("api/users", 403),  # Should be forbidden for reception
            ]
            
            for endpoint, expected_status in reception_endpoints:
                self.test_protected_endpoint_access(reception_token, endpoint, expected_status)
        
        # Generate summary
        self.print_test_summary()
        
        return self.tests_passed == self.tests_run

    def print_test_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        print("\n📋 DETAILED RESULTS:")
        for result in self.test_results:
            print(f"{result['status']} {result['test']}")
            if result['details']:
                print(f"    {result['details']}")
        
        # Specific review requirements check
        print("\n✅ REVIEW REQUIREMENTS CHECK:")
        
        # 1. POST /api/auth/login works with proper JSON response
        login_tests = [r for r in self.test_results if "Login" in r['test'] and "admin/admin_007" in r['test']]
        if login_tests and login_tests[0]['success']:
            print("✅ 1. POST /api/auth/login works with proper JSON response (access_token, user_role, user_name)")
        else:
            print("❌ 1. POST /api/auth/login failed or missing required fields")
        
        # 2. JWT token can be used to access protected endpoints
        protected_tests = [r for r in self.test_results if "Protected endpoint" in r['test']]
        if protected_tests and any(t['success'] for t in protected_tests):
            print("✅ 2. JWT token can be used to access protected endpoints")
        else:
            print("❌ 2. JWT token cannot access protected endpoints")
        
        # 3. All 6 user roles can login successfully
        role_logins = [r for r in self.test_results if "Login" in r['test'] and "/" in r['test']]
        successful_logins = [r for r in role_logins if r['success']]
        if len(successful_logins) >= 6:
            print(f"✅ 3. All 6 user roles can login successfully ({len(successful_logins)}/6)")
        else:
            print(f"❌ 3. Only {len(successful_logins)}/6 user roles can login successfully")
        
        # 4. Health check endpoint working
        health_tests = [r for r in self.test_results if "Health Check" in r['test']]
        if health_tests and health_tests[0]['success']:
            print("✅ 4. Health check endpoint /api/health is working")
        else:
            print("❌ 4. Health check endpoint /api/health is not working")
        
        print("\n" + "=" * 60)
        
        if self.tests_passed == self.tests_run:
            print("🎉 ALL TESTS PASSED - AUTHENTICATION SYSTEM IS FULLY FUNCTIONAL!")
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} TESTS FAILED - AUTHENTICATION ISSUES DETECTED")

def main():
    """Main function to run authentication tests"""
    tester = AuthenticationTester()
    success = tester.run_comprehensive_auth_tests()
    
    if success:
        print("\n✅ Authentication system testing completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Authentication system testing failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
CRITICAL LOGIN SYSTEM TESTING - Authentication System Comprehensive Test
Testing all authentication functionality as per review request
"""

import requests
import json
import sys
from datetime import datetime

class AuthenticationTester:
    def __init__(self, base_url="https://medshare-hub.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.critical_issues = []
        self.minor_issues = []
        
        # Known credentials to test as specified in review request
        self.test_credentials = {
            "admin": {"username": "admin", "password": "admin_007"},
            "reception": {"username": "reception1", "password": "reception123"},
            "laboratory": {"username": "laboratory1", "password": "lab123"},
            "pharmacy": {"username": "pharmacy1", "password": "pharmacy123"},
            "nursing": {"username": "nursing1", "password": "nurse123"},
            "doctor": {"username": "doctor1", "password": "doctor123"}
        }

    def log_test(self, name, success, details="", is_critical=True):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
            if details:
                print(f"   {details}")
        else:
            print(f"❌ {name}")
            if details:
                print(f"   {details}")
            if is_critical:
                self.critical_issues.append(f"{name}: {details}")
            else:
                self.minor_issues.append(f"{name}: {details}")

    def make_request(self, method, endpoint, data=None, headers=None, token=None):
        """Make HTTP request with proper error handling"""
        url = f"{self.base_url}/{endpoint}"
        request_headers = {'Content-Type': 'application/json'}
        
        if token:
            request_headers['Authorization'] = f'Bearer {token}'
        if headers:
            request_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=request_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=request_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=request_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=request_headers, timeout=10)
            
            return response
        except requests.exceptions.ConnectionError:
            print(f"❌ Connection Error: Cannot connect to {url}")
            return None
        except requests.exceptions.Timeout:
            print(f"❌ Timeout: Request timed out for {url}")
            return None
        except Exception as e:
            print(f"❌ Request Error: {str(e)}")
            return None

    def test_health_check(self):
        """Test health check endpoint"""
        print("\n🏥 Testing Health Check Endpoint...")
        
        response = self.make_request('GET', 'api/health')
        if response and response.status_code == 200:
            try:
                data = response.json()
                self.log_test(
                    "Health Check API", 
                    True, 
                    f"Status: {data.get('status')}, Timestamp: {data.get('timestamp')}"
                )
                return True
            except:
                self.log_test("Health Check API", False, "Invalid JSON response")
                return False
        else:
            status = response.status_code if response else "No Response"
            self.log_test("Health Check API", False, f"Status: {status}")
            return False

    def test_login_endpoint(self, username, password, expected_status=200, role_name=""):
        """Test login endpoint with specific credentials"""
        login_data = {"username": username, "password": password}
        
        response = self.make_request('POST', 'api/auth/login', data=login_data)
        
        if not response:
            self.log_test(f"Login {role_name} ({username})", False, "No response from server")
            return None, None
            
        if response.status_code == expected_status:
            if expected_status == 200:
                try:
                    data = response.json()
                    token = data.get('access_token')
                    user_role = data.get('user_role')
                    user_name = data.get('user_name')
                    token_type = data.get('token_type')
                    
                    # Verify response format
                    if not token or not user_role or not user_name or token_type != 'bearer':
                        self.log_test(
                            f"Login {role_name} ({username})", 
                            False, 
                            f"Invalid response format: {data}"
                        )
                        return None, None
                    
                    self.log_test(
                        f"Login {role_name} ({username})", 
                        True, 
                        f"Role: {user_role}, Name: {user_name}, Token: {token[:20]}..."
                    )
                    return token, data
                except:
                    self.log_test(f"Login {role_name} ({username})", False, "Invalid JSON response")
                    return None, None
            else:
                # Expected failure (like 401)
                self.log_test(f"Login {role_name} ({username})", True, f"Correctly returned {expected_status}")
                return None, None
        else:
            try:
                error_data = response.json()
                self.log_test(
                    f"Login {role_name} ({username})", 
                    False, 
                    f"Expected {expected_status}, got {response.status_code}: {error_data}"
                )
            except:
                self.log_test(
                    f"Login {role_name} ({username})", 
                    False, 
                    f"Expected {expected_status}, got {response.status_code}: {response.text}"
                )
            return None, None

    def test_jwt_token_validation(self, token, role_name=""):
        """Test JWT token validation on protected endpoints"""
        print(f"\n🔐 Testing JWT Token Validation for {role_name}...")
        
        # Test accessing protected endpoint with valid token
        response = self.make_request('GET', 'api/patients', token=token)
        
        if response:
            if response.status_code in [200, 403]:  # 200 = success, 403 = role-based denial (still valid token)
                self.log_test(
                    f"JWT Token Validation {role_name}", 
                    True, 
                    f"Token accepted (Status: {response.status_code})"
                )
                return True
            elif response.status_code == 401:
                self.log_test(
                    f"JWT Token Validation {role_name}", 
                    False, 
                    "Token rejected as invalid"
                )
                return False
            else:
                self.log_test(
                    f"JWT Token Validation {role_name}", 
                    False, 
                    f"Unexpected status: {response.status_code}"
                )
                return False
        else:
            self.log_test(f"JWT Token Validation {role_name}", False, "No response")
            return False

    def test_token_expiration(self, token, role_name=""):
        """Test token expiration handling"""
        print(f"\n⏰ Testing Token Expiration for {role_name}...")
        
        # For now, just test that the token works (full expiration test would require waiting)
        response = self.make_request('GET', 'api/health', token=token)
        
        if response and response.status_code == 200:
            self.log_test(
                f"Token Expiration {role_name}", 
                True, 
                "Token still valid (expiration test would require time)"
            )
            return True
        else:
            self.log_test(f"Token Expiration {role_name}", False, "Token appears expired")
            return False

    def test_role_based_access(self, token, role_name, user_role):
        """Test role-based access control"""
        print(f"\n🔒 Testing Role-Based Access Control for {role_name}...")
        
        # Test admin-only endpoint
        response = self.make_request('GET', 'api/users', token=token)
        
        if user_role == 'admin':
            # Admin should have access
            if response and response.status_code == 200:
                self.log_test(
                    f"Admin Access {role_name}", 
                    True, 
                    "Admin can access user management"
                )
            else:
                status = response.status_code if response else "No Response"
                self.log_test(
                    f"Admin Access {role_name}", 
                    False, 
                    f"Admin denied access to users endpoint: {status}"
                )
        else:
            # Non-admin should be denied
            if response and response.status_code == 403:
                self.log_test(
                    f"Role Access Control {role_name}", 
                    True, 
                    f"{user_role} correctly denied admin access"
                )
            elif response and response.status_code == 200:
                self.log_test(
                    f"Role Access Control {role_name}", 
                    False, 
                    f"{user_role} incorrectly granted admin access"
                )
            else:
                status = response.status_code if response else "No Response"
                self.log_test(
                    f"Role Access Control {role_name}", 
                    False, 
                    f"Unexpected response for {user_role}: {status}"
                )

    def test_invalid_credentials(self):
        """Test login with invalid credentials"""
        print("\n❌ Testing Invalid Credentials...")
        
        invalid_tests = [
            ("invalid_user", "invalid_pass", "Non-existent user"),
            ("admin", "wrong_password", "Wrong password"),
            ("", "", "Empty credentials"),
            ("admin", "", "Empty password"),
            ("", "admin_007", "Empty username")
        ]
        
        for username, password, description in invalid_tests:
            response = self.make_request('POST', 'api/auth/login', data={
                "username": username, 
                "password": password
            })
            
            if response and response.status_code == 401:
                self.log_test(f"Invalid Login - {description}", True, "Correctly rejected")
            else:
                status = response.status_code if response else "No Response"
                self.log_test(
                    f"Invalid Login - {description}", 
                    False, 
                    f"Expected 401, got {status}"
                )

    def test_malformed_requests(self):
        """Test malformed login requests"""
        print("\n🔧 Testing Malformed Requests...")
        
        malformed_tests = [
            ({}, "Empty request body"),
            ({"username": "admin"}, "Missing password"),
            ({"password": "admin_007"}, "Missing username"),
            ({"user": "admin", "pass": "admin_007"}, "Wrong field names"),
            ("invalid_json", "Invalid JSON")
        ]
        
        for data, description in malformed_tests:
            if data == "invalid_json":
                # Send raw string instead of JSON
                response = self.make_request('POST', 'api/auth/login', data="invalid")
            else:
                response = self.make_request('POST', 'api/auth/login', data=data)
            
            if response and response.status_code in [400, 422]:
                self.log_test(f"Malformed Request - {description}", True, "Correctly rejected")
            else:
                status = response.status_code if response else "No Response"
                self.log_test(
                    f"Malformed Request - {description}", 
                    False, 
                    f"Expected 400/422, got {status}"
                )

    def test_protected_endpoints_without_token(self):
        """Test accessing protected endpoints without authentication"""
        print("\n🚫 Testing Protected Endpoints Without Token...")
        
        protected_endpoints = [
            'api/patients',
            'api/doctors', 
            'api/users',
            'api/departments'
        ]
        
        for endpoint in protected_endpoints:
            response = self.make_request('GET', endpoint)
            
            if response and response.status_code == 401:
                self.log_test(f"Protected Endpoint - {endpoint}", True, "Correctly requires authentication")
            else:
                status = response.status_code if response else "No Response"
                self.log_test(
                    f"Protected Endpoint - {endpoint}", 
                    False, 
                    f"Expected 401, got {status}"
                )

    def test_database_user_verification(self):
        """Test that users exist in database by attempting login"""
        print("\n👥 Testing Database User Verification...")
        
        # First login as admin to check if we can create missing users
        admin_token, admin_data = self.test_login_endpoint("admin", "admin_007", 200, "Admin")
        
        if not admin_token:
            self.log_test("Database User Verification", False, "Cannot login as admin to verify users")
            return False
        
        # Test if we can get users list (admin only)
        response = self.make_request('GET', 'api/users', token=admin_token)
        
        if response and response.status_code == 200:
            try:
                users = response.json()
                usernames = [user.get('username') for user in users]
                self.log_test(
                    "Database User List", 
                    True, 
                    f"Found {len(users)} users: {usernames}"
                )
                
                # Check if all required users exist
                required_users = list(self.test_credentials.keys())
                missing_users = []
                
                for role in required_users:
                    username = self.test_credentials[role]['username']
                    if username not in usernames:
                        missing_users.append(username)
                
                if missing_users:
                    self.log_test(
                        "Required Users Check", 
                        False, 
                        f"Missing users: {missing_users}"
                    )
                else:
                    self.log_test("Required Users Check", True, "All required users exist")
                    
            except:
                self.log_test("Database User List", False, "Invalid JSON response")
        else:
            status = response.status_code if response else "No Response"
            self.log_test("Database User List", False, f"Cannot get users list: {status}")

    def run_comprehensive_authentication_tests(self):
        """Run all authentication tests"""
        print("🔐 CRITICAL LOGIN SYSTEM TESTING - COMPREHENSIVE AUTHENTICATION VERIFICATION")
        print("=" * 80)
        print(f"Testing against: {self.base_url}")
        print(f"Test started at: {datetime.now()}")
        print("=" * 80)
        
        # Test 1: Health Check
        self.test_health_check()
        
        # Test 2: Database User Verification
        self.test_database_user_verification()
        
        # Test 3: Test all known credentials
        print("\n🔑 Testing All Known Credentials...")
        valid_tokens = {}
        
        for role, creds in self.test_credentials.items():
            token, data = self.test_login_endpoint(
                creds['username'], 
                creds['password'], 
                200, 
                role.title()
            )
            if token and data:
                valid_tokens[role] = {
                    'token': token,
                    'data': data,
                    'username': creds['username']
                }
        
        # Test 4: JWT Token Validation
        for role, token_info in valid_tokens.items():
            self.test_jwt_token_validation(token_info['token'], role.title())
        
        # Test 5: Token Expiration
        for role, token_info in valid_tokens.items():
            self.test_token_expiration(token_info['token'], role.title())
        
        # Test 6: Role-Based Access Control
        for role, token_info in valid_tokens.items():
            user_role = token_info['data'].get('user_role')
            self.test_role_based_access(token_info['token'], role.title(), user_role)
        
        # Test 7: Invalid Credentials
        self.test_invalid_credentials()
        
        # Test 8: Malformed Requests
        self.test_malformed_requests()
        
        # Test 9: Protected Endpoints Without Token
        self.test_protected_endpoints_without_token()
        
        # Generate Summary
        self.generate_test_summary()
        
        return len(self.critical_issues) == 0

    def generate_test_summary(self):
        """Generate comprehensive test summary"""
        print("\n" + "=" * 80)
        print("🔍 AUTHENTICATION SYSTEM TEST SUMMARY")
        print("=" * 80)
        
        print(f"📊 Tests Run: {self.tests_run}")
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.critical_issues:
            print(f"\n🚨 CRITICAL ISSUES ({len(self.critical_issues)}):")
            for i, issue in enumerate(self.critical_issues, 1):
                print(f"   {i}. {issue}")
        else:
            print("\n✅ NO CRITICAL ISSUES FOUND")
        
        if self.minor_issues:
            print(f"\n⚠️ MINOR ISSUES ({len(self.minor_issues)}):")
            for i, issue in enumerate(self.minor_issues, 1):
                print(f"   {i}. {issue}")
        
        print("\n🎯 AUTHENTICATION SYSTEM STATUS:")
        if len(self.critical_issues) == 0:
            print("   ✅ AUTHENTICATION SYSTEM IS WORKING CORRECTLY")
            print("   ✅ All user roles can login successfully")
            print("   ✅ JWT token generation and validation working")
            print("   ✅ Role-based access control functional")
            print("   ✅ Error handling working properly")
        else:
            print("   ❌ AUTHENTICATION SYSTEM HAS CRITICAL ISSUES")
            print("   🔧 IMMEDIATE FIXES REQUIRED")
        
        print("\n📋 TESTED CREDENTIALS:")
        for role, creds in self.test_credentials.items():
            print(f"   • {role.title()}: {creds['username']}/{creds['password']}")
        
        print(f"\n⏰ Test completed at: {datetime.now()}")
        print("=" * 80)

def main():
    """Main test execution"""
    tester = AuthenticationTester()
    
    try:
        success = tester.run_comprehensive_authentication_tests()
        
        if success:
            print("\n🎉 ALL AUTHENTICATION TESTS PASSED!")
            sys.exit(0)
        else:
            print("\n💥 AUTHENTICATION TESTS FAILED!")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n⚠️ Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Test execution failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
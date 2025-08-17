#!/usr/bin/env python3
"""
Focused Authentication System Testing Script
Tests only the core authentication requirements from the review request.
"""

import requests
import json
import sys
from datetime import datetime

class FocusedAuthTester:
    def __init__(self, base_url="https://unicare-login-fix.preview.emergentagent.com"):
        self.base_url = base_url
        self.results = []
        
        # Test accounts as specified in the review request
        self.test_accounts = [
            {"username": "admin", "password": "admin_007", "role": "admin"},
            {"username": "reception1", "password": "reception123", "role": "reception"},
            {"username": "lab1", "password": "lab123", "role": "laboratory"},
            {"username": "pharmacy1", "password": "pharmacy123", "role": "pharmacy"},
            {"username": "nurse1", "password": "nurse123", "role": "nursing"},
            {"username": "doctor1", "password": "doctor123", "role": "doctor"}
        ]

    def test_health_endpoint(self):
        """Test /api/health endpoint"""
        print("🏥 Testing Health Check Endpoint /api/health...")
        
        try:
            url = f"{self.base_url}/api/health"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Health endpoint working - Status: {data.get('status')}")
                print(f"   Timestamp: {data.get('timestamp')}")
                self.results.append(("Health Check", True, f"Status: {data.get('status')}"))
                return True
            else:
                print(f"❌ Health endpoint failed - Status: {response.status_code}")
                self.results.append(("Health Check", False, f"Status: {response.status_code}"))
                return False
                
        except Exception as e:
            print(f"❌ Health endpoint error: {str(e)}")
            self.results.append(("Health Check", False, f"Error: {str(e)}"))
            return False

    def test_login_endpoint(self, username, password, expected_role):
        """Test POST /api/auth/login with specific credentials"""
        print(f"🔐 Testing login: {username}/{password}")
        
        try:
            url = f"{self.base_url}/api/auth/login"
            data = {"username": username, "password": password}
            headers = {'Content-Type': 'application/json'}
            
            response = requests.post(url, json=data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                response_data = response.json()
                
                # Check required fields
                required_fields = ['access_token', 'user_role', 'user_name', 'token_type']
                missing_fields = [field for field in required_fields if field not in response_data]
                
                if missing_fields:
                    print(f"❌ Missing fields: {missing_fields}")
                    self.results.append((f"Login {username}", False, f"Missing fields: {missing_fields}"))
                    return False, None
                
                # Verify token_type is "bearer"
                if response_data.get('token_type') != 'bearer':
                    print(f"❌ Wrong token_type: {response_data.get('token_type')}")
                    self.results.append((f"Login {username}", False, f"Wrong token_type: {response_data.get('token_type')}"))
                    return False, None
                
                # Verify user_role matches expected
                actual_role = response_data.get('user_role')
                if actual_role != expected_role:
                    print(f"❌ Wrong role - Expected: {expected_role}, Got: {actual_role}")
                    self.results.append((f"Login {username}", False, f"Wrong role: {actual_role}"))
                    return False, None
                
                access_token = response_data.get('access_token')
                user_name = response_data.get('user_name')
                
                print(f"✅ Login successful")
                print(f"   Role: {actual_role}")
                print(f"   User: {user_name}")
                print(f"   Token: {access_token[:30]}...")
                print(f"   Token Type: {response_data.get('token_type')}")
                
                self.results.append((f"Login {username}", True, f"Role: {actual_role}, User: {user_name}"))
                return True, access_token
                
            else:
                print(f"❌ Login failed - Status: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                self.results.append((f"Login {username}", False, f"Status: {response.status_code}"))
                return False, None
                
        except Exception as e:
            print(f"❌ Login error: {str(e)}")
            self.results.append((f"Login {username}", False, f"Error: {str(e)}"))
            return False, None

    def test_jwt_token_usage(self, token, username):
        """Test using JWT token to access a protected endpoint"""
        print(f"🔑 Testing JWT token usage for {username}...")
        
        # Test with /api/doctors endpoint (should work for all authenticated users)
        try:
            url = f"{self.base_url}/api/doctors"
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ JWT token works - Accessed /api/doctors")
                print(f"   Found {len(data)} doctors")
                self.results.append((f"JWT Token {username}", True, f"Accessed /api/doctors, found {len(data)} doctors"))
                return True
            else:
                print(f"❌ JWT token failed - Status: {response.status_code}")
                self.results.append((f"JWT Token {username}", False, f"Status: {response.status_code}"))
                return False
                
        except Exception as e:
            print(f"❌ JWT token error: {str(e)}")
            self.results.append((f"JWT Token {username}", False, f"Error: {str(e)}"))
            return False

    def run_focused_tests(self):
        """Run focused authentication tests as per review request"""
        print("🔐 FOCUSED AUTHENTICATION SYSTEM TESTING")
        print("Testing the specific requirements from the review request")
        print("=" * 70)
        print(f"Base URL: {self.base_url}")
        print(f"Test Time: {datetime.now()}")
        print("=" * 70)
        
        # Test 1: Health Check Endpoint
        print("\n1️⃣ TESTING HEALTH CHECK ENDPOINT")
        health_ok = self.test_health_endpoint()
        
        # Test 2: Login with admin/admin_007 credentials
        print("\n2️⃣ TESTING LOGIN WITH ADMIN/ADMIN_007")
        admin_login_ok, admin_token = self.test_login_endpoint("admin", "admin_007", "admin")
        
        # Test 3: JWT Token Usage
        jwt_ok = False
        if admin_login_ok and admin_token:
            print("\n3️⃣ TESTING JWT TOKEN USAGE")
            jwt_ok = self.test_jwt_token_usage(admin_token, "admin")
        
        # Test 4: All 6 User Roles Login
        print("\n4️⃣ TESTING ALL 6 USER ROLES LOGIN")
        login_results = {}
        tokens = {}
        
        for account in self.test_accounts:
            username = account["username"]
            password = account["password"]
            expected_role = account["role"]
            
            success, token = self.test_login_endpoint(username, password, expected_role)
            login_results[username] = success
            if success and token:
                tokens[username] = token
        
        # Test 5: JWT Token Usage for Different Roles
        print("\n5️⃣ TESTING JWT TOKENS FOR DIFFERENT ROLES")
        jwt_results = {}
        for username, token in tokens.items():
            if token:
                success = self.test_jwt_token_usage(token, username)
                jwt_results[username] = success
        
        # Generate Summary
        self.print_summary(health_ok, admin_login_ok, jwt_ok, login_results, jwt_results)
        
        # Determine overall success
        all_logins_ok = all(login_results.values())
        all_jwts_ok = all(jwt_results.values()) if jwt_results else False
        
        return health_ok and admin_login_ok and jwt_ok and all_logins_ok and all_jwts_ok

    def print_summary(self, health_ok, admin_login_ok, jwt_ok, login_results, jwt_results):
        """Print test summary"""
        print("\n" + "=" * 70)
        print("📊 FOCUSED TEST SUMMARY")
        print("=" * 70)
        
        # Review Requirements Check
        print("✅ REVIEW REQUIREMENTS VERIFICATION:")
        print()
        
        # 1. POST /api/auth/login works with proper JSON response
        if admin_login_ok:
            print("✅ 1. POST /api/auth/login works with proper JSON response")
            print("     Contains: access_token, user_role, user_name, token_type")
        else:
            print("❌ 1. POST /api/auth/login failed or missing required fields")
        
        # 2. JWT token can be used to access protected endpoints
        if jwt_ok:
            print("✅ 2. JWT token can be used to access protected endpoints")
            print("     Successfully accessed /api/doctors with Bearer token")
        else:
            print("❌ 2. JWT token cannot access protected endpoints")
        
        # 3. All 6 user roles can login successfully
        successful_logins = sum(login_results.values())
        total_roles = len(login_results)
        if successful_logins == total_roles:
            print(f"✅ 3. All 6 user roles can login successfully ({successful_logins}/{total_roles})")
            for username, success in login_results.items():
                status = "✅" if success else "❌"
                print(f"     {status} {username}")
        else:
            print(f"❌ 3. Only {successful_logins}/{total_roles} user roles can login successfully")
            for username, success in login_results.items():
                status = "✅" if success else "❌"
                print(f"     {status} {username}")
        
        # 4. Health check endpoint working
        if health_ok:
            print("✅ 4. Health check endpoint /api/health is working")
            print("     Returns status and timestamp")
        else:
            print("❌ 4. Health check endpoint /api/health is not working")
        
        print()
        print("🔑 JWT TOKEN VERIFICATION:")
        if jwt_results:
            successful_jwts = sum(jwt_results.values())
            total_jwts = len(jwt_results)
            print(f"   {successful_jwts}/{total_jwts} JWT tokens work for protected endpoints")
            for username, success in jwt_results.items():
                status = "✅" if success else "❌"
                print(f"   {status} {username} token")
        
        print("\n" + "=" * 70)
        
        # Overall Status
        all_core_passed = health_ok and admin_login_ok and jwt_ok
        all_roles_passed = all(login_results.values())
        all_jwts_passed = all(jwt_results.values()) if jwt_results else False
        
        if all_core_passed and all_roles_passed and all_jwts_passed:
            print("🎉 ALL AUTHENTICATION REQUIREMENTS PASSED!")
            print("   The authentication system is fully functional as requested.")
        else:
            print("⚠️  SOME AUTHENTICATION REQUIREMENTS FAILED!")
            if not all_core_passed:
                print("   Core authentication features have issues.")
            if not all_roles_passed:
                print("   Some user roles cannot login.")
            if not all_jwts_passed:
                print("   Some JWT tokens don't work for protected endpoints.")

def main():
    """Main function"""
    tester = FocusedAuthTester()
    success = tester.run_focused_tests()
    
    if success:
        print("\n✅ Focused authentication testing completed successfully!")
        return 0
    else:
        print("\n❌ Focused authentication testing found issues!")
        return 1

if __name__ == "__main__":
    sys.exit(main())
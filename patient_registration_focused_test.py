#!/usr/bin/env python3
"""
Focused Patient Registration API Test
Testing the exact workflow that NewOPDPage.jsx would use
"""

import requests
import json
from datetime import datetime

def test_newopd_workflow():
    """Test the exact API calls that NewOPDPage.jsx makes"""
    base_url = "http://localhost:8001"
    
    print("🏥 Testing NewOPDPage.jsx API Workflow")
    print("=" * 50)
    
    # Step 1: Login as reception (as NewOPDPage would)
    print("\n1️⃣ Login as reception user...")
    login_response = requests.post(f"{base_url}/api/auth/login", json={
        "username": "reception1",
        "password": "reception123"
    })
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        return False
        
    token = login_response.json()['access_token']
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    print("✅ Login successful")
    
    # Step 2: Load doctors (as NewOPDPage does in useEffect)
    print("\n2️⃣ Loading doctors list...")
    doctors_response = requests.get(f"{base_url}/api/doctors", headers=headers)
    
    if doctors_response.status_code != 200:
        print(f"❌ Failed to load doctors: {doctors_response.status_code}")
        return False
        
    doctors = doctors_response.json()
    print(f"✅ Loaded {len(doctors)} doctors")
    
    # Step 3: Load existing patients (as NewOPDPage does)
    print("\n3️⃣ Loading existing patients...")
    patients_response = requests.get(f"{base_url}/api/patients", headers=headers)
    
    if patients_response.status_code != 200:
        print(f"❌ Failed to load patients: {patients_response.status_code}")
        return False
        
    existing_patients = patients_response.json()
    print(f"✅ Loaded {len(existing_patients)} existing patients")
    
    # Step 4: Create patient with exact data structure from NewOPDPage
    print("\n4️⃣ Creating patient with NewOPDPage data structure...")
    
    # This matches exactly what NewOPDPage.jsx sends
    patient_data = {
        "patient_name": "Lakshmi Pillai",
        "age": "42",
        "dob": "1982-05-10",
        "sex": "Female", 
        "address": "789 Boat Club Road, Ernakulam, Kerala",
        "phone_number": "9876543213",
        "assigned_doctor": doctors[0]['id'],  # Select first doctor
        "visit_type": "New",
        "patient_rating": 8
    }
    
    print(f"📤 Sending patient data: {json.dumps(patient_data, indent=2)}")
    
    create_response = requests.post(f"{base_url}/api/patients", 
                                  json=patient_data, 
                                  headers=headers)
    
    if create_response.status_code != 200:
        print(f"❌ Patient creation failed: {create_response.status_code}")
        print(f"Error: {create_response.text}")
        return False
        
    created_patient = create_response.json()
    print("✅ Patient created successfully!")
    print(f"   Patient ID: {created_patient['id']}")
    print(f"   OPD Number: {created_patient['opd_number']}")
    print(f"   Token Number: {created_patient['token_number']}")
    
    # Step 5: Verify all fields are returned as expected by frontend
    print("\n5️⃣ Verifying returned data matches frontend expectations...")
    
    expected_fields = [
        'id', 'patient_name', 'age', 'sex', 'phone_number', 
        'opd_number', 'token_number', 'created_at', 'updated_at'
    ]
    
    missing_fields = [field for field in expected_fields if field not in created_patient]
    if missing_fields:
        print(f"❌ Missing fields: {missing_fields}")
        return False
        
    print("✅ All expected fields present in response")
    
    # Step 6: Verify patient appears in updated list (as frontend would reload)
    print("\n6️⃣ Verifying patient appears in updated list...")
    
    updated_patients_response = requests.get(f"{base_url}/api/patients", headers=headers)
    updated_patients = updated_patients_response.json()
    
    patient_found = any(p['id'] == created_patient['id'] for p in updated_patients)
    if not patient_found:
        print("❌ Created patient not found in updated list")
        return False
        
    print(f"✅ Patient found in updated list ({len(updated_patients)} total patients)")
    
    # Step 7: Test OPD number format validation
    print("\n7️⃣ Validating OPD number format...")
    
    import re
    opd_pattern = r'^\d{3}/\d{2}$'
    if not re.match(opd_pattern, created_patient['opd_number']):
        print(f"❌ Invalid OPD format: {created_patient['opd_number']}")
        return False
        
    print(f"✅ OPD number format valid: {created_patient['opd_number']}")
    
    # Step 8: Test that frontend would get proper error for invalid data
    print("\n8️⃣ Testing validation errors...")
    
    invalid_data = {
        "patient_name": "",  # Empty name should fail
        "phone_number": "123",  # Invalid phone
        "sex": "Female"
    }
    
    error_response = requests.post(f"{base_url}/api/patients", 
                                 json=invalid_data, 
                                 headers=headers)
    
    if error_response.status_code == 422:
        print("✅ Validation errors properly returned")
    else:
        print(f"⚠️ Expected 422 validation error, got {error_response.status_code}")
    
    print("\n🎉 NewOPDPage.jsx API Workflow Test PASSED!")
    print("✅ All API calls that the frontend makes are working correctly")
    return True

if __name__ == "__main__":
    success = test_newopd_workflow()
    exit(0 if success else 1)
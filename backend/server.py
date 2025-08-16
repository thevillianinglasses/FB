from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional, List
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
import uuid
import logging
import aiofiles
import shutil
from pathlib import Path

# Import our models and auth
from models import *
from auth import *

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="Unicare EHR API", version="2.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database configuration
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/unicare_ehr")

# File upload configuration
UPLOAD_DIR = Path("/app/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}

# Global variables for database
mongodb_client: AsyncIOMotorClient = None
database = None

# Security
security = HTTPBearer()

# Database startup and shutdown events
@app.on_event("startup")
async def create_db_client():
    global mongodb_client, database
    try:
        mongodb_client = AsyncIOMotorClient(MONGO_URL)
        database = mongodb_client.get_database()
        
        # Test the connection
        await database.command('ping')
        logging.info("Connected to MongoDB successfully")
        
        # Initialize default admin user
        existing_admin = await database.users.find_one({"username": "admin"})
        if not existing_admin:
            admin_user = {
                "id": str(uuid.uuid4()),
                "username": "admin",
                "password_hash": get_password_hash("admin_007"),
                "full_name": "System Administrator",
                "role": UserRole.ADMIN,
                "department": "Administration",
                "email": "admin@unicare.com",
                "status": UserStatus.ACTIVE,
                "created_at": datetime.utcnow()
            }
            await database.users.insert_one(admin_user)
            logging.info("Default admin user created")
        
        # Initialize default doctors if not exist
        existing_doctors = await database.doctors.count_documents({})
        if existing_doctors == 0:
            default_doctors = [
                {
                    "id": str(uuid.uuid4()),
                    "name": "Dr. Emily Carter",
                    "specialty": "General Medicine",
                    "qualification": "MBBS, MD",
                    "default_fee": "500",  # Changed to string to match model
                    "phone": "9876543210",
                    "room_number": "101",
                    "created_at": datetime.utcnow()
                },
                {
                    "id": str(uuid.uuid4()),
                    "name": "Dr. John Adebayo",
                    "specialty": "Cardiology",
                    "qualification": "MBBS, DM Cardiology",
                    "default_fee": "800",  # Changed to string to match model
                    "phone": "9876543211",
                    "room_number": "102",
                    "created_at": datetime.utcnow()
                }
            ]
            await database.doctors.insert_many(default_doctors)
            logging.info("Default doctors created")
            
        # Initialize default lab tests
        existing_tests = await database.lab_tests.count_documents({})
        if existing_tests == 0:
            default_tests = [
                {
                    "id": str(uuid.uuid4()),
                    "test_name": "Complete Blood Count",
                    "test_code": "CBC",
                    "category": "Hematology",
                    "sample_type": "Blood",
                    "price": 250.0,
                    "tat_hours": 4,
                    "created_at": datetime.utcnow()
                },
                {
                    "id": str(uuid.uuid4()),
                    "test_name": "Blood Sugar Fasting",
                    "test_code": "BSF",
                    "category": "Biochemistry",
                    "sample_type": "Blood",
                    "price": 100.0,
                    "tat_hours": 2,
                    "preparation_notes": "12 hours fasting required",
                    "created_at": datetime.utcnow()
                }
            ]
            await database.lab_tests.insert_many(default_tests)
            logging.info("Default lab tests created")
            
        # Initialize default medications
        existing_meds = await database.medications.count_documents({})
        if existing_meds == 0:
            default_medications = [
                {
                    "id": str(uuid.uuid4()),
                    "name": "Paracetamol",
                    "generic_name": "Acetaminophen",
                    "strength": "500mg",
                    "form": "Tablet",
                    "mrp": 25.0,
                    "selling_price": 20.0,
                    "stock_quantity": 500,
                    "category": "Analgesic",
                    "created_at": datetime.utcnow()
                },
                {
                    "id": str(uuid.uuid4()),
                    "name": "Amoxicillin",
                    "generic_name": "Amoxicillin",
                    "strength": "250mg",
                    "form": "Capsule",
                    "mrp": 60.0,
                    "selling_price": 50.0,
                    "stock_quantity": 200,
                    "category": "Antibiotic",
                    "created_at": datetime.utcnow()
                }
            ]
            await database.medications.insert_many(default_medications)
            logging.info("Default medications created")
            
    except Exception as e:
        logging.error(f"Error connecting to MongoDB: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_db_client():
    global mongodb_client
    if mongodb_client:
        mongodb_client.close()

# Auth dependency
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token_data = verify_token(credentials.credentials)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return token_data

# Utility functions
async def get_next_opd_number():
    """Generate next OPD number in format NNN/YY"""
    current_year = datetime.utcnow().year
    year_suffix = str(current_year)[-2:]
    
    sequence_doc = await database.sequences.find_one({"type": "opd", "year": current_year})
    
    if not sequence_doc:
        next_number = 1
        await database.sequences.insert_one({"type": "opd", "year": current_year, "current": next_number})
    else:
        next_number = sequence_doc["current"] + 1
        await database.sequences.update_one(
            {"type": "opd", "year": current_year},
            {"$set": {"current": next_number}}
        )
    
    return f"{str(next_number).zfill(3)}/{year_suffix}"

async def get_next_token_number():
    """Generate next token number for today"""
    today = datetime.utcnow().date()
    
    sequence_doc = await database.sequences.find_one({"type": "token", "date": today.isoformat()})
    
    if not sequence_doc:
        next_number = 1
        await database.sequences.insert_one({"type": "token", "date": today.isoformat(), "current": next_number})
    else:
        next_number = sequence_doc["current"] + 1
        await database.sequences.update_one(
            {"type": "token", "date": today.isoformat()},
            {"$set": {"current": next_number}}
        )
    
    return str(next_number)

async def get_next_bill_number():
    """Generate next bill number"""
    sequence_doc = await database.sequences.find_one({"type": "bill"})
    
    if not sequence_doc:
        next_number = 1
        await database.sequences.insert_one({"type": "bill", "current": next_number})
    else:
        next_number = sequence_doc["current"] + 1
        await database.sequences.update_one(
            {"type": "bill"},
            {"$set": {"current": next_number}}
        )
    
    return f"BILL{str(next_number).zfill(6)}"

# ===================
# AUTHENTICATION APIS
# ===================

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

@app.post("/api/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    # Check if user exists
    user = await database.users.find_one({"username": user_data.username, "status": "active"})
    
    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last login
    await database.users.update_one(
        {"id": user["id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"], "role": user["role"], "user_id": user["id"]}, 
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_role": user["role"],
        "user_name": user["full_name"]
    }

# ===================
# USER MANAGEMENT APIS (Admin Only)
# ===================

@app.get("/api/users", response_model=List[User])
async def get_users(current_user: dict = Depends(get_current_user)):
    if not has_admin_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        users_cursor = database.users.find({})
        users = []
        async for user in users_cursor:
            user_data = User(**user)
            user_data.password_hash = ""  # Don't send password hash
            users.append(user_data)
        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching users: {str(e)}")

@app.post("/api/users", response_model=User)
async def create_user(user_data: UserCreate, current_user: dict = Depends(get_current_user)):
    if not has_admin_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        # Check if username already exists
        existing_user = await database.users.find_one({"username": user_data.username})
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already exists")
        
        # Create new user
        user_dict = user_data.dict()
        user_dict["id"] = str(uuid.uuid4())
        user_dict["password_hash"] = get_password_hash(user_data.password)
        del user_dict["password"]  # Remove plain password
        user_dict["created_at"] = datetime.utcnow()
        user_dict["updated_at"] = datetime.utcnow()
        user_dict["status"] = UserStatus.ACTIVE
        
        result = await database.users.insert_one(user_dict)
        user_dict["_id"] = str(result.inserted_id)
        
        # Return user without password hash
        response_user = User(**user_dict)
        response_user.password_hash = ""
        return response_user
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating user: {str(e)}")

@app.put("/api/users/{user_id}/status")
async def update_user_status(user_id: str, status: UserStatus, current_user: dict = Depends(get_current_user)):
    if not has_admin_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        result = await database.users.update_one(
            {"id": user_id},
            {"$set": {"status": status, "updated_at": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"message": f"User status updated to {status}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating user status: {str(e)}")

# ===================
# PATIENT MANAGEMENT APIS
# ===================

@app.get("/api/patients", response_model=List[Patient])
async def get_patients(current_user: dict = Depends(get_current_user)):
    if not has_reception_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        patients_cursor = database.patients.find({}).sort("created_at", -1)
        patients = []
        async for patient in patients_cursor:
            patients.append(Patient(**patient))
        return patients
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching patients: {str(e)}")

@app.post("/api/patients", response_model=Patient)
async def add_patient(patient: Patient, current_user: dict = Depends(get_current_user)):
    if not has_reception_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        # Check if patient with this phone number already exists
        existing_patient = await database.patients.find_one({"phone_number": patient.phone_number})
        
        if existing_patient:
            # Update existing patient and create a new visit record
            patient_id = existing_patient["_id"]
            
            # Update patient info (in case of changes)
            update_data = {
                "patient_name": patient.patient_name,
                "age": patient.age,
                "dob": patient.dob,
                "sex": patient.sex,
                "address": patient.address,
                "email": patient.email,
                "emergency_contact_name": patient.emergency_contact_name,
                "emergency_contact_phone": patient.emergency_contact_phone,
                "allergies": patient.allergies,
                "medical_history": patient.medical_history,
                "updated_at": datetime.utcnow()
            }
            
            await database.patients.update_one({"_id": patient_id}, {"$set": update_data})
            
            # Create new visit record in visits collection
            visit_data = {
                "id": str(uuid.uuid4()),
                "patient_id": str(patient_id),
                "patient_name": patient.patient_name,
                "phone_number": patient.phone_number,
                "age": patient.age,
                "sex": patient.sex,
                "address": patient.address,  # Include address field for appointment check-in
                "assigned_doctor": patient.assigned_doctor if hasattr(patient, 'assigned_doctor') else "",
                "visit_type": patient.visit_type if hasattr(patient, 'visit_type') else "Follow-up",
                "opd_number": await get_next_opd_number(),
                "token_number": await get_next_token_number(),
                "created_at": datetime.utcnow(),
                "status": "Active"
            }
            
            # For now, store visit as a new patient record with visit info
            # In a proper implementation, this would go to a separate visits collection
            visit_patient_dict = visit_data
            result = await database.patients.insert_one(visit_patient_dict)
            # Return the visit data with the UUID id, not MongoDB _id
            return Patient(**visit_patient_dict)
        else:
            # Create new patient
            patient_dict = patient.dict()
            patient_dict["id"] = str(uuid.uuid4())  # Generate UUID for id field
            patient_dict["opd_number"] = await get_next_opd_number()
            patient_dict["token_number"] = await get_next_token_number()
            patient_dict["status"] = "Active"
            patient_dict["created_at"] = datetime.utcnow()
            patient_dict["updated_at"] = datetime.utcnow()
            
            result = await database.patients.insert_one(patient_dict)
            # Return the patient data with the UUID id, not MongoDB _id
            return Patient(**patient_dict)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding patient: {str(e)}")

@app.put("/api/patients/{patient_id}", response_model=Patient)
async def update_patient(patient_id: str, patient: Patient, current_user: dict = Depends(get_current_user)):
    if not has_reception_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        patient_dict = patient.dict()
        patient_dict["updated_at"] = datetime.utcnow()
        
        result = await database.patients.update_one(
            {"id": patient_id},
            {"$set": patient_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        updated_patient = await database.patients.find_one({"id": patient_id})
        return Patient(**updated_patient)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating patient: {str(e)}")

@app.delete("/api/patients/{patient_id}")
async def delete_patient(patient_id: str, current_user: dict = Depends(get_current_user)):
    if not has_reception_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        result = await database.patients.delete_one({"id": patient_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Patient not found")
        return {"message": "Patient deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting patient: {str(e)}")

# ===================
# DOCTOR MANAGEMENT APIS
# ===================

@app.get("/api/doctors", response_model=List[Doctor])
async def get_doctors(current_user: dict = Depends(get_current_user)):
    try:
        doctors_cursor = database.doctors.find({})
        doctors = []
        async for doctor in doctors_cursor:
            doctors.append(Doctor(**doctor))
        return doctors
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching doctors: {str(e)}")

@app.post("/api/doctors", response_model=Doctor)
async def add_doctor(doctor: Doctor, current_user: dict = Depends(get_current_user)):
    if not has_admin_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        doctor_dict = doctor.dict()
        doctor_dict["created_at"] = datetime.utcnow()
        result = await database.doctors.insert_one(doctor_dict)
        return Doctor(**doctor_dict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding doctor: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

# ===================
# LABORATORY APIS
# ===================

@app.get("/api/lab/tests", response_model=List[LabTest])
async def get_lab_tests(current_user: dict = Depends(get_current_user)):
    if not has_lab_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        tests_cursor = database.lab_tests.find({})
        tests = []
        async for test in tests_cursor:
            tests.append(LabTest(**test))
        return tests
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching lab tests: {str(e)}")

@app.post("/api/lab/tests", response_model=LabTest)
async def add_lab_test(test: LabTest, current_user: dict = Depends(get_current_user)):
    if not has_lab_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        test_dict = test.dict()
        test_dict["created_at"] = datetime.utcnow()
        result = await database.lab_tests.insert_one(test_dict)
        return LabTest(**test_dict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding lab test: {str(e)}")

@app.get("/api/lab/orders", response_model=List[LabOrder])
async def get_lab_orders(current_user: dict = Depends(get_current_user)):
    if not has_lab_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        orders_cursor = database.lab_orders.find({}).sort("created_at", -1)
        orders = []
        async for order in orders_cursor:
            orders.append(LabOrder(**order))
        return orders
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching lab orders: {str(e)}")

@app.post("/api/lab/orders", response_model=LabOrder)
async def create_lab_order(order: LabOrder, current_user: dict = Depends(get_current_user)):
    if not has_lab_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        # Calculate total amount
        total_amount = 0.0
        for test_id in order.tests:
            test = await database.lab_tests.find_one({"id": test_id})
            if test:
                total_amount += test.get("price", 0.0)
        
        order_dict = order.dict()
        order_dict["total_amount"] = total_amount
        order_dict["created_at"] = datetime.utcnow()
        order_dict["updated_at"] = datetime.utcnow()
        
        result = await database.lab_orders.insert_one(order_dict)
        return LabOrder(**order_dict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating lab order: {str(e)}")

@app.put("/api/lab/orders/{order_id}/status")
async def update_lab_order_status(order_id: str, status: TestStatus, current_user: dict = Depends(get_current_user)):
    if not has_lab_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        update_data = {"status": status, "updated_at": datetime.utcnow()}
        
        if status == TestStatus.COLLECTED:
            update_data["sample_collected_at"] = datetime.utcnow()
        elif status == TestStatus.REPORTED:
            update_data["reported_at"] = datetime.utcnow()
        
        result = await database.lab_orders.update_one(
            {"id": order_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Lab order not found")
        
        return {"message": f"Lab order status updated to {status}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating lab order status: {str(e)}")

@app.get("/api/lab/results", response_model=List[LabResult])
async def get_lab_results(current_user: dict = Depends(get_current_user)):
    if not has_lab_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        results_cursor = database.lab_results.find({}).sort("created_at", -1)
        results = []
        async for result in results_cursor:
            results.append(LabResult(**result))
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching lab results: {str(e)}")

@app.post("/api/lab/results", response_model=LabResult)
async def add_lab_result(result: LabResult, current_user: dict = Depends(get_current_user)):
    if not has_lab_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        result_dict = result.dict()
        result_dict["validated_by"] = current_user["username"]
        result_dict["validated_at"] = datetime.utcnow()
        result_dict["created_at"] = datetime.utcnow()
        
        result_doc = await database.lab_results.insert_one(result_dict)
        return LabResult(**result_dict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding lab result: {str(e)}")

# ===================
# PHARMACY APIS
# ===================

@app.get("/api/pharmacy/medications", response_model=List[Medication])
async def get_medications(current_user: dict = Depends(get_current_user)):
    if not has_pharmacy_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        meds_cursor = database.medications.find({})
        medications = []
        async for med in meds_cursor:
            medications.append(Medication(**med))
        return medications
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching medications: {str(e)}")

@app.post("/api/pharmacy/medications", response_model=Medication)
async def add_medication(medication: Medication, current_user: dict = Depends(get_current_user)):
    if not has_pharmacy_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        med_dict = medication.dict()
        med_dict["created_at"] = datetime.utcnow()
        med_dict["updated_at"] = datetime.utcnow()
        
        result = await database.medications.insert_one(med_dict)
        return Medication(**med_dict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding medication: {str(e)}")

@app.put("/api/pharmacy/medications/{med_id}/stock")
async def update_medication_stock(med_id: str, quantity: int, current_user: dict = Depends(get_current_user)):
    if not has_pharmacy_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        result = await database.medications.update_one(
            {"id": med_id},
            {"$set": {"stock_quantity": quantity, "updated_at": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Medication not found")
        
        return {"message": "Stock updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating stock: {str(e)}")

@app.get("/api/pharmacy/prescriptions", response_model=List[Prescription])
async def get_prescriptions(current_user: dict = Depends(get_current_user)):
    if not has_pharmacy_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        prescriptions_cursor = database.prescriptions.find({}).sort("prescribed_date", -1)
        prescriptions = []
        async for prescription in prescriptions_cursor:
            prescriptions.append(Prescription(**prescription))
        return prescriptions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching prescriptions: {str(e)}")

@app.post("/api/pharmacy/prescriptions", response_model=Prescription)
async def create_prescription(prescription: Prescription, current_user: dict = Depends(get_current_user)):
    if not has_doctor_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        # Calculate total amount
        total_amount = 0.0
        for med_item in prescription.medications:
            medication = await database.medications.find_one({"id": med_item.get("medication_id")})
            if medication:
                quantity = med_item.get("quantity", 1)
                total_amount += medication.get("selling_price", 0.0) * quantity
        
        prescription_dict = prescription.dict()
        prescription_dict["total_amount"] = total_amount
        prescription_dict["prescribed_date"] = datetime.utcnow()
        prescription_dict["created_at"] = datetime.utcnow()
        prescription_dict["updated_at"] = datetime.utcnow()
        
        result = await database.prescriptions.insert_one(prescription_dict)
        return Prescription(**prescription_dict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating prescription: {str(e)}")

@app.put("/api/pharmacy/prescriptions/{prescription_id}/dispense")
async def dispense_prescription(prescription_id: str, current_user: dict = Depends(get_current_user)):
    if not has_pharmacy_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        # Update prescription status
        result = await database.prescriptions.update_one(
            {"id": prescription_id},
            {"$set": {
                "status": PrescriptionStatus.DISPENSED,
                "dispensed_date": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Prescription not found")
        
        # TODO: Update medication stock quantities
        
        return {"message": "Prescription dispensed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error dispensing prescription: {str(e)}")

# ===================
# NURSING APIS
# ===================

@app.get("/api/nursing/vitals", response_model=List[VitalSigns])
async def get_vitals(current_user: dict = Depends(get_current_user)):
    if not has_nursing_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        vitals_cursor = database.vital_signs.find({}).sort("recorded_at", -1)
        vitals = []
        async for vital in vitals_cursor:
            vitals.append(VitalSigns(**vital))
        return vitals
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching vitals: {str(e)}")

@app.post("/api/nursing/vitals", response_model=VitalSigns)
async def record_vitals(vitals: VitalSigns, current_user: dict = Depends(get_current_user)):
    if not has_nursing_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        vitals_dict = vitals.dict()
        vitals_dict["recorded_by"] = current_user["username"]
        vitals_dict["recorded_at"] = datetime.utcnow()
        
        result = await database.vital_signs.insert_one(vitals_dict)
        return VitalSigns(**vitals_dict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error recording vitals: {str(e)}")

@app.get("/api/nursing/procedures", response_model=List[NursingProcedure])
async def get_nursing_procedures(current_user: dict = Depends(get_current_user)):
    if not has_nursing_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        procedures_cursor = database.nursing_procedures.find({}).sort("performed_at", -1)
        procedures = []
        async for procedure in procedures_cursor:
            procedures.append(NursingProcedure(**procedure))
        return procedures
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching procedures: {str(e)}")

@app.post("/api/nursing/procedures", response_model=NursingProcedure)
async def record_nursing_procedure(procedure: NursingProcedure, current_user: dict = Depends(get_current_user)):
    if not has_nursing_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        procedure_dict = procedure.dict()
        procedure_dict["performed_by"] = current_user["username"]
        procedure_dict["performed_at"] = datetime.utcnow()
        
        result = await database.nursing_procedures.insert_one(procedure_dict)
        return NursingProcedure(**procedure_dict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error recording procedure: {str(e)}")

# ===================
# DOCTOR/EMR APIS
# ===================

@app.get("/api/emr/consultations", response_model=List[Consultation])
async def get_consultations(current_user: dict = Depends(get_current_user)):
    if not has_doctor_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        consultations_cursor = database.consultations.find({}).sort("consultation_date", -1)
        consultations = []
        async for consultation in consultations_cursor:
            consultations.append(Consultation(**consultation))
        return consultations
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching consultations: {str(e)}")

@app.post("/api/emr/consultations", response_model=Consultation)
async def create_consultation(consultation: Consultation, current_user: dict = Depends(get_current_user)):
    if not has_doctor_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        consultation_dict = consultation.dict()
        consultation_dict["consultation_date"] = datetime.utcnow()
        consultation_dict["created_at"] = datetime.utcnow()
        
        result = await database.consultations.insert_one(consultation_dict)
        return Consultation(**consultation_dict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating consultation: {str(e)}")

# ===================
# BILLING APIS
# ===================

@app.get("/api/billing/bills", response_model=List[Bill])
async def get_bills(current_user: dict = Depends(get_current_user)):
    if not has_reception_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        bills_cursor = database.bills.find({}).sort("created_at", -1)
        bills = []
        async for bill in bills_cursor:
            bills.append(Bill(**bill))
        return bills
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching bills: {str(e)}")

@app.post("/api/billing/bills", response_model=Bill)
async def create_bill(bill: Bill, current_user: dict = Depends(get_current_user)):
    if not has_reception_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        bill_number = await get_next_bill_number()
        
        bill_dict = bill.dict()
        bill_dict["bill_number"] = bill_number
        bill_dict["created_at"] = datetime.utcnow()
        bill_dict["updated_at"] = datetime.utcnow()
        
        result = await database.bills.insert_one(bill_dict)
        return Bill(**bill_dict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating bill: {str(e)}")

@app.get("/api/patients/{patient_id}/vitals", response_model=List[VitalSigns])
async def get_patient_vitals(patient_id: str, current_user: dict = Depends(get_current_user)):
    try:
        vitals_cursor = database.vital_signs.find({"patient_id": patient_id}).sort("recorded_at", -1)
        vitals = []
        async for vital in vitals_cursor:
            vitals.append(VitalSigns(**vital))
        return vitals
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching patient vitals: {str(e)}")

@app.get("/api/patients/{patient_id}/consultations", response_model=List[Consultation])
async def get_patient_consultations(patient_id: str, current_user: dict = Depends(get_current_user)):
    try:
        consultations_cursor = database.consultations.find({"patient_id": patient_id}).sort("consultation_date", -1)
        consultations = []
        async for consultation in consultations_cursor:
            consultations.append(Consultation(**consultation))
        return consultations
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching patient consultations: {str(e)}")

# ===================
# APPOINTMENT MANAGEMENT APIS
# ===================

@app.get("/api/appointments", response_model=List[Appointment])
async def get_appointments(
    date: Optional[str] = None,
    doctor_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get appointments with optional filtering by date, doctor, or status"""
    if not has_reception_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        # Build query filters
        query = {}
        if date:
            query["appointment_date"] = date
        if doctor_id:
            query["doctor_id"] = doctor_id
        if status:
            query["status"] = status
            
        appointments_cursor = database.appointments.find(query).sort("appointment_date", 1).sort("appointment_time", 1)
        appointments = []
        async for appointment in appointments_cursor:
            appointments.append(Appointment(**appointment))
        return appointments
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching appointments: {str(e)}")

@app.get("/api/appointments/today", response_model=List[Appointment])
async def get_todays_appointments(current_user: dict = Depends(get_current_user)):
    """Get all appointments for today"""
    if not has_reception_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        today = datetime.utcnow().date().isoformat()
        appointments_cursor = database.appointments.find({"appointment_date": today}).sort("appointment_time", 1)
        appointments = []
        async for appointment in appointments_cursor:
            appointments.append(Appointment(**appointment))
        return appointments
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching today's appointments: {str(e)}")

@app.get("/api/appointments/doctor/{doctor_id}", response_model=List[Appointment])
async def get_doctor_appointments(doctor_id: str, date: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Get all appointments for a specific doctor, optionally filtered by date"""
    if not has_reception_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        query = {"doctor_id": doctor_id}
        if date:
            query["appointment_date"] = date
            
        appointments_cursor = database.appointments.find(query).sort("appointment_date", 1).sort("appointment_time", 1)
        appointments = []
        async for appointment in appointments_cursor:
            appointments.append(Appointment(**appointment))
        return appointments
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching doctor appointments: {str(e)}")

@app.post("/api/appointments", response_model=Appointment)
async def create_appointment(appointment: AppointmentCreate, current_user: dict = Depends(get_current_user)):
    """Create a new appointment"""
    if not has_reception_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        appointment_dict = appointment.dict()
        appointment_dict["id"] = str(uuid.uuid4())
        appointment_dict["status"] = AppointmentStatus.SCHEDULED
        appointment_dict["created_at"] = datetime.utcnow()
        appointment_dict["updated_at"] = datetime.utcnow()
        
        result = await database.appointments.insert_one(appointment_dict)
        return Appointment(**appointment_dict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating appointment: {str(e)}")

@app.get("/api/appointments/{appointment_id}", response_model=Appointment)
async def get_appointment(appointment_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific appointment by ID"""
    if not has_reception_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        appointment = await database.appointments.find_one({"id": appointment_id})
        if not appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")
        return Appointment(**appointment)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching appointment: {str(e)}")

@app.put("/api/appointments/{appointment_id}", response_model=Appointment)
async def update_appointment(appointment_id: str, appointment_update: AppointmentUpdate, current_user: dict = Depends(get_current_user)):
    """Update an existing appointment"""
    if not has_reception_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        update_dict = appointment_update.dict(exclude_unset=True)
        if update_dict:
            update_dict["updated_at"] = datetime.utcnow()
            
            result = await database.appointments.update_one(
                {"id": appointment_id},
                {"$set": update_dict}
            )
            
            if result.matched_count == 0:
                raise HTTPException(status_code=404, detail="Appointment not found")
        
        updated_appointment = await database.appointments.find_one({"id": appointment_id})
        return Appointment(**updated_appointment)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating appointment: {str(e)}")

@app.delete("/api/appointments/{appointment_id}")
async def delete_appointment(appointment_id: str, current_user: dict = Depends(get_current_user)):
    """Delete an appointment"""
    if not has_reception_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        result = await database.appointments.delete_one({"id": appointment_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Appointment not found")
        return {"message": "Appointment deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting appointment: {str(e)}")

@app.put("/api/appointments/{appointment_id}/status")
async def update_appointment_status(appointment_id: str, status: AppointmentStatus, current_user: dict = Depends(get_current_user)):
    """Update appointment status (Scheduled, Confirmed, Checked In, etc.)"""
    if not has_reception_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        update_data = {
            "status": status,
            "updated_at": datetime.utcnow()
        }
        
        result = await database.appointments.update_one(
            {"id": appointment_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        updated_appointment = await database.appointments.find_one({"id": appointment_id})
        return Appointment(**updated_appointment)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating appointment status: {str(e)}")

# ===================
# ADMIN REPORTS & DOCTOR MANAGEMENT APIS 
# ===================

@app.get("/api/admin/reports/departments")
async def get_departments_with_doctors(current_user: dict = Depends(get_current_user)):
    """Get all departments with their doctors for admin reports"""
    if not has_admin_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        doctors_cursor = database.doctors.find({})
        departments = {}
        
        async for doctor in doctors_cursor:
            specialty = doctor.get("specialty", "General")
            if specialty not in departments:
                departments[specialty] = []
            departments[specialty].append(Doctor(**doctor))
        
        # Convert to list format for frontend
        result = []
        for dept_name, doctors_list in departments.items():
            result.append({
                "department": dept_name,
                "doctors": doctors_list,
                "total_doctors": len(doctors_list)
            })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching departments report: {str(e)}")

@app.get("/api/admin/doctors/{doctor_id}/profile", response_model=DoctorProfile)
async def get_doctor_profile(doctor_id: str, current_user: dict = Depends(get_current_user)):
    """Get detailed doctor profile with certificates"""
    if not has_admin_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        # Get doctor profile or create if not exists
        profile = await database.doctor_profiles.find_one({"doctor_id": doctor_id})
        
        if not profile:
            # Create empty profile for doctor
            doctor = await database.doctors.find_one({"id": doctor_id})
            if not doctor:
                raise HTTPException(status_code=404, detail="Doctor not found")
            
            profile_data = {
                "id": str(uuid.uuid4()),
                "doctor_id": doctor_id,
                "degree": doctor.get("qualification", ""),
                "registration_number": doctor.get("registration_number", ""),
                "address": doctor.get("address", ""),
                "phone": doctor.get("phone", ""),
                "email": doctor.get("email", ""),
                "certificates": [],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            await database.doctor_profiles.insert_one(profile_data)
            return DoctorProfile(**profile_data)
        
        return DoctorProfile(**profile)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching doctor profile: {str(e)}")

@app.put("/api/admin/doctors/{doctor_id}/profile")
async def update_doctor_profile(doctor_id: str, profile_update: DoctorProfile, current_user: dict = Depends(get_current_user)):
    """Update doctor profile details"""
    if not has_admin_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        profile_dict = profile_update.dict()
        profile_dict["updated_at"] = datetime.utcnow()
        
        # Update or create profile
        result = await database.doctor_profiles.update_one(
            {"doctor_id": doctor_id},
            {"$set": profile_dict},
            upsert=True
        )
        
        # Also update basic doctor info
        await database.doctors.update_one(
            {"id": doctor_id},
            {"$set": {
                "qualification": profile_dict.get("degree", ""),
                "registration_number": profile_dict.get("registration_number", ""),
                "address": profile_dict.get("address", ""),
                "phone": profile_dict.get("phone", ""),
                "email": profile_dict.get("email", ""),
                "has_profile": True,
                "updated_at": datetime.utcnow()
            }}
        )
        
        return {"message": "Doctor profile updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating doctor profile: {str(e)}")

@app.delete("/api/admin/doctors/{doctor_id}")
async def delete_doctor(doctor_id: str, current_user: dict = Depends(get_current_user)):
    """Delete doctor from admin panel"""
    if not has_admin_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        # Delete doctor and their profile
        doctor_result = await database.doctors.delete_one({"id": doctor_id})
        profile_result = await database.doctor_profiles.delete_one({"doctor_id": doctor_id})
        
        if doctor_result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Doctor not found")
        
        return {"message": "Doctor deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting doctor: {str(e)}")

@app.put("/api/admin/doctors/{doctor_id}")
async def update_doctor_admin(doctor_id: str, doctor_update: DoctorUpdate, current_user: dict = Depends(get_current_user)):
    """Update doctor details from admin panel"""
    if not has_admin_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        update_dict = doctor_update.dict(exclude_unset=True)
        if update_dict:
            update_dict["updated_at"] = datetime.utcnow()
            
            result = await database.doctors.update_one(
                {"id": doctor_id},
                {"$set": update_dict}
            )
            
            if result.matched_count == 0:
                raise HTTPException(status_code=404, detail="Doctor not found")
        
        updated_doctor = await database.doctors.find_one({"id": doctor_id})
        return Doctor(**updated_doctor)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating doctor: {str(e)}")

# ===================
# VITAL SIGNS & NURSING INTEGRATION APIS
# ===================

@app.get("/api/nursing/patients/today", response_model=List[Patient])
async def get_todays_patients_for_nursing(current_user: dict = Depends(get_current_user)):
    """Get today's registered patients for nursing vital signs"""
    if not has_nursing_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        today = datetime.utcnow().date().isoformat()
        
        # Get patients registered today (24-hour rolling)
        patients_cursor = database.patients.find({
            "created_at": {
                "$gte": datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0),
                "$lt": datetime.utcnow().replace(hour=23, minute=59, second=59, microsecond=999999)
            }
        }).sort("created_at", -1)
        
        patients = []
        async for patient in patients_cursor:
            patients.append(Patient(**patient))
        
        return patients
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching today's patients: {str(e)}")

@app.get("/api/nursing/patient/by-opd/{opd_number}")
async def get_patient_by_opd(opd_number: str, current_user: dict = Depends(get_current_user)):
    """Get patient details by OPD number for vital signs entry"""
    if not has_nursing_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        patient = await database.patients.find_one({"opd_number": opd_number})
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient with this OPD number not found")
        
        return Patient(**patient)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching patient by OPD: {str(e)}")

@app.post("/api/nursing/vitals", response_model=VitalSigns)
async def create_vital_signs(vitals: VitalSignsCreate, current_user: dict = Depends(get_current_user)):
    """Record vital signs for a patient"""
    if not has_nursing_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        # Calculate BMI if height and weight are provided
        bmi = ""
        if vitals.height and vitals.weight:
            try:
                height_m = float(vitals.height) / 100  # Convert cm to meters
                weight_kg = float(vitals.weight)
                if height_m > 0:
                    bmi_value = weight_kg / (height_m ** 2)
                    bmi = f"{bmi_value:.1f}"
            except (ValueError, ZeroDivisionError):
                bmi = ""
        
        vitals_dict = vitals.dict()
        vitals_dict["id"] = str(uuid.uuid4())
        vitals_dict["bmi"] = bmi
        vitals_dict["recorded_by"] = current_user["username"]
        vitals_dict["recorded_at"] = datetime.utcnow()
        
        result = await database.vital_signs.insert_one(vitals_dict)
        return VitalSigns(**vitals_dict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error recording vital signs: {str(e)}")

@app.get("/api/doctor/patient/{patient_id}/vitals", response_model=List[VitalSigns])
async def get_patient_vitals_for_doctor(patient_id: str, current_user: dict = Depends(get_current_user)):
    """Get patient vital signs for doctor portal"""
    if not has_doctor_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        vitals_cursor = database.vital_signs.find({"patient_id": patient_id}).sort("recorded_at", -1)
        vitals = []
        async for vital in vitals_cursor:
            vitals.append(VitalSigns(**vital))
        return vitals
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching patient vitals: {str(e)}")

@app.get("/api/doctor/patient/opd/{opd_number}/vitals", response_model=List[VitalSigns])
async def get_patient_vitals_by_opd_for_doctor(opd_number: str, current_user: dict = Depends(get_current_user)):
    """Get patient vital signs by OPD number for doctor portal"""
    if not has_doctor_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        vitals_cursor = database.vital_signs.find({"opd_number": opd_number}).sort("recorded_at", -1)
        vitals = []
        async for vital in vitals_cursor:
            vitals.append(VitalSigns(**vital))
        return vitals
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching patient vitals by OPD: {str(e)}")

# ===================
# DEPARTMENTS API (RESTful)
# ===================

@app.get("/api/departments", response_model=List[dict])
async def get_all_departments(current_user: dict = Depends(get_current_user)):
    """Get all departments"""
    try:
        departments_cursor = database.departments.find({})
        departments = []
        async for dept in departments_cursor:
            departments.append({
                "id": dept.get("id"),
                "name": dept.get("name"),
                "description": dept.get("description", ""),
                "headDoctorId": dept.get("head_doctor_id"),
                "location": dept.get("location", ""),
                "contactPhone": dept.get("contact_number", ""),
                "createdAt": dept.get("created_at"),
                "updatedAt": dept.get("updated_at")
            })
        return departments
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching departments: {str(e)}")

@app.post("/api/departments")
async def create_department(department_data: dict, current_user: dict = Depends(get_current_user)):
    """Create a new department"""
    if not has_admin_or_reception_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        # Check if department already exists
        existing_dept = await database.departments.find_one({"name": department_data["name"].upper()})
        if existing_dept:
            raise HTTPException(status_code=400, detail="Department with this name already exists")
        
        # Create new department
        new_department = {
            "id": str(uuid.uuid4()),
            "name": department_data["name"].upper(),
            "description": department_data.get("description", ""),
            "head_doctor_id": department_data.get("headDoctorId"),
            "location": department_data.get("location", ""),
            "contact_number": department_data.get("contactPhone", ""),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "created_by": current_user.get("username", "system")
        }
        
        await database.departments.insert_one(new_department)
        
        return {
            "id": new_department["id"],
            "name": new_department["name"],
            "description": new_department["description"],
            "headDoctorId": new_department["head_doctor_id"],
            "location": new_department["location"],
            "contactPhone": new_department["contact_number"],
            "createdAt": new_department["created_at"].isoformat(),
            "updatedAt": new_department["updated_at"].isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating department: {str(e)}")

@app.put("/api/departments/{dept_id}")
async def update_department(dept_id: str, department_data: dict, current_user: dict = Depends(get_current_user)):
    """Update a department"""
    if not has_admin_or_reception_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        updated_data = {
            "name": department_data["name"].upper(),
            "description": department_data.get("description", ""),
            "head_doctor_id": department_data.get("headDoctorId"),
            "location": department_data.get("location", ""),
            "contact_number": department_data.get("contactPhone", ""),
            "updated_at": datetime.utcnow()
        }
        
        result = await database.departments.update_one(
            {"id": dept_id},
            {"$set": updated_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Department not found")
        
        return {"message": "Department updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating department: {str(e)}")

@app.delete("/api/departments/{dept_id}")
async def delete_department(dept_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a department"""
    if not has_admin_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        # Check if department has doctors
        doctors_count = await database.doctors.count_documents({"specialty": dept_id})
        if doctors_count > 0:
            raise HTTPException(status_code=400, detail="Cannot delete department with assigned doctors")
        
        result = await database.departments.delete_one({"id": dept_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Department not found")
        
        return {"message": "Department deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting department: {str(e)}")

# ===================
# DOCTORS API (RESTful)
# ===================

@app.get("/api/doctors", response_model=List[dict])
async def get_doctors(departmentId: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Get all doctors or doctors by department"""
    try:
        filter_query = {}
        if departmentId:
            filter_query["department_id"] = departmentId
        
        doctors_cursor = database.doctors.find(filter_query)
        doctors = []
        async for doctor in doctors_cursor:
            doctors.append({
                "id": doctor.get("id"),
                "name": doctor.get("name"),
                "degree": doctor.get("qualification", ""),
                "departmentId": doctor.get("department_id"),
                "phone": doctor.get("phone", ""),
                "email": doctor.get("email", ""),
                "fee": doctor.get("default_fee", "500"),
                "availabilityNote": doctor.get("availability_note", ""),
                "createdAt": doctor.get("created_at"),
                "updatedAt": doctor.get("updated_at")
            })
        return doctors
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching doctors: {str(e)}")

@app.post("/api/doctors")
async def create_doctor(doctor_data: dict, current_user: dict = Depends(get_current_user)):
    """Create a new doctor"""
    if not has_admin_or_reception_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        # Validate department exists
        if doctor_data.get("departmentId"):
            dept_exists = await database.departments.find_one({"id": doctor_data["departmentId"]})
            if not dept_exists:
                raise HTTPException(status_code=400, detail="Department not found")
        
        # Create new doctor
        new_doctor = {
            "id": str(uuid.uuid4()),
            "name": doctor_data["name"].strip(),
            "qualification": doctor_data.get("degree", ""),
            "department_id": doctor_data.get("departmentId"),
            "specialty": doctor_data.get("specialty", "GENERAL MEDICINE"), # For backward compatibility
            "phone": doctor_data.get("phone", ""),
            "email": doctor_data.get("email", ""),
            "default_fee": str(doctor_data.get("fee", "500")),
            "availability_note": doctor_data.get("availabilityNote", ""),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "created_by": current_user.get("username", "system")
        }
        
        await database.doctors.insert_one(new_doctor)
        
        return {
            "id": new_doctor["id"],
            "name": new_doctor["name"],
            "degree": new_doctor["qualification"],
            "departmentId": new_doctor["department_id"],
            "phone": new_doctor["phone"],
            "email": new_doctor["email"],
            "fee": new_doctor["default_fee"],
            "availabilityNote": new_doctor["availability_note"],
            "createdAt": new_doctor["created_at"].isoformat(),
            "updatedAt": new_doctor["updated_at"].isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating doctor: {str(e)}")

@app.put("/api/doctors/{doctor_id}")
async def update_doctor(doctor_id: str, doctor_data: dict, current_user: dict = Depends(get_current_user)):
    """Update a doctor"""
    if not has_admin_or_reception_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        updated_data = {
            "name": doctor_data["name"].strip(),
            "qualification": doctor_data.get("degree", ""),
            "department_id": doctor_data.get("departmentId"),
            "phone": doctor_data.get("phone", ""),
            "email": doctor_data.get("email", ""),
            "default_fee": str(doctor_data.get("fee", "500")),
            "availability_note": doctor_data.get("availabilityNote", ""),
            "updated_at": datetime.utcnow()
        }
        
        result = await database.doctors.update_one(
            {"id": doctor_id},
            {"$set": updated_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Doctor not found")
        
        return {"message": "Doctor updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating doctor: {str(e)}")

@app.delete("/api/doctors/{doctor_id}")
async def delete_doctor(doctor_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a doctor"""
    if not has_admin_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        result = await database.doctors.delete_one({"id": doctor_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Doctor not found")
        
        return {"message": "Doctor deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting doctor: {str(e)}")

# Helper function for role access
def has_admin_or_reception_access(role):
    return role in ["admin", "reception"]

# ===================
# FILE UPLOAD APIS
# ===================

@app.post("/api/admin/doctors/{doctor_id}/upload-document")
async def upload_doctor_document(
    doctor_id: str,
    file: UploadFile = File(...),
    document_type: str = "Other Document",
    current_user: dict = Depends(get_current_user)
):
    """Upload a document for a doctor"""
    if not has_admin_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        # Validate file size
        file_content = await file.read()
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File size exceeds 5MB limit")
        
        # Reset file pointer
        await file.seek(0)
        
        # Validate file extension
        file_extension = Path(file.filename).suffix.lower()
        if file_extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail="Invalid file type. Only PDF, JPG, PNG allowed")
        
        # Generate unique filename
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        unique_filename = f"{doctor_id}_{document_type}_{timestamp}{file_extension}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Create certificate record
        certificate = {
            "id": str(uuid.uuid4()),
            "certificate_name": document_type,
            "file_path": str(file_path),
            "file_name": file.filename,
            "unique_filename": unique_filename,
            "uploaded_at": datetime.utcnow()
        }
        
        # Update doctor profile with certificate
        await database.doctor_profiles.update_one(
            {"doctor_id": doctor_id},
            {"$push": {"certificates": certificate}},
            upsert=True
        )
        
        return {
            "message": "Document uploaded successfully",
            "certificate_id": certificate["id"],
            "filename": unique_filename
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading document: {str(e)}")

@app.get("/api/admin/doctors/{doctor_id}/documents/{filename}")
async def download_doctor_document(
    doctor_id: str, 
    filename: str, 
    current_user: dict = Depends(get_current_user)
):
    """Download a doctor's document"""
    if not has_admin_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        file_path = UPLOAD_DIR / filename
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type='application/octet-stream'
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error downloading document: {str(e)}")

@app.delete("/api/admin/doctors/{doctor_id}/documents/{certificate_id}")
async def delete_doctor_document(
    doctor_id: str,
    certificate_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a doctor's document"""
    if not has_admin_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        # Find and remove certificate from profile
        profile = await database.doctor_profiles.find_one({"doctor_id": doctor_id})
        if not profile:
            raise HTTPException(status_code=404, detail="Doctor profile not found")
        
        # Find certificate to delete
        certificate_to_delete = None
        for cert in profile.get("certificates", []):
            if cert["id"] == certificate_id:
                certificate_to_delete = cert
                break
        
        if not certificate_to_delete:
            raise HTTPException(status_code=404, detail="Certificate not found")
        
        # Delete file from filesystem
        file_path = Path(certificate_to_delete["file_path"])
        if file_path.exists():
            file_path.unlink()
        
        # Remove from database
        await database.doctor_profiles.update_one(
            {"doctor_id": doctor_id},
            {"$pull": {"certificates": {"id": certificate_id}}}
        )
        
        return {"message": "Document deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")

# ===================
# PDF GENERATION API
# ===================

@app.post("/api/admin/doctors/{doctor_id}/generate-pdf")
async def generate_doctor_profile_pdf(
    doctor_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Generate PDF for doctor profile"""
    if not has_admin_access(current_user["role"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        # Get doctor details
        doctor = await database.doctors.find_one({"id": doctor_id})
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")
        
        # Get doctor profile
        profile = await database.doctor_profiles.find_one({"doctor_id": doctor_id})
        
        # For now, return the HTML content that can be used for PDF generation
        # In a full implementation, this would use a library like WeasyPrint or Playwright
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>UNICARE POLYCLINIC - Doctor Profile</title>
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; }}
                .header {{ text-align: center; margin-bottom: 30px; border-bottom: 2px solid #6495ED; padding-bottom: 20px; }}
                .header h1 {{ color: #6495ED; margin: 0; font-size: 28px; }}
                .header p {{ color: #36454F; margin: 5px 0; }}
                .section {{ margin-bottom: 20px; }}
                .section h3 {{ color: #36454F; border-bottom: 2px solid #6495ED; padding-bottom: 5px; }}
                .field {{ margin-bottom: 10px; }}
                .field strong {{ color: #36454F; }}
                .documents {{ background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 15px; }}
                .footer {{ text-align: center; margin-top: 40px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }}
                .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }}
                @media print {{ body {{ margin: 0; }} }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>UNICARE POLYCLINIC</h1>
                <p>Complete Doctor Profile Report</p>
                <p>Generated on: {datetime.utcnow().strftime('%d/%m/%Y %H:%M')} IST</p>
            </div>

            <div class="section">
                <h3>Basic Information</h3>
                <div class="grid">
                    <div class="field"><strong>Name:</strong> Dr. {doctor.get('name', 'N/A')}</div>
                    <div class="field"><strong>Degree:</strong> {doctor.get('qualification', 'N/A')}</div>
                    <div class="field"><strong>Department:</strong> {doctor.get('specialty', 'N/A')}</div>
                    <div class="field"><strong>Registration No:</strong> {doctor.get('registration_number', 'N/A')}</div>
                </div>
            </div>

            <div class="section">
                <h3>Contact Information</h3>
                <div class="grid">
                    <div class="field"><strong>Phone:</strong> {doctor.get('phone', 'N/A')}</div>
                    <div class="field"><strong>Email:</strong> {doctor.get('email', 'N/A')}</div>
                </div>
                <div class="field"><strong>Address:</strong> {doctor.get('address', 'N/A')}</div>
            </div>

            <div class="section">
                <h3>Professional Details</h3>
                <div class="grid">
                    <div class="field"><strong>Consultation Fee:</strong> ₹{doctor.get('default_fee', 'N/A')}</div>
                    <div class="field"><strong>Room Number:</strong> {doctor.get('room_number', 'N/A')}</div>
                </div>
                <div class="field"><strong>Schedule:</strong> {doctor.get('schedule', 'N/A')}</div>
            </div>

            {f'''
            <div class="section">
                <h3>Uploaded Documents</h3>
                <div class="documents">
                    {chr(10).join([f'<div class="field">• {cert.get("certificate_name", "Unknown")}: {cert.get("file_name", "N/A")} (Uploaded: {cert.get("uploaded_at", datetime.utcnow()).strftime("%d/%m/%Y") if isinstance(cert.get("uploaded_at"), datetime) else "N/A"})</div>' for cert in profile.get("certificates", [])])}
                </div>
            </div>
            ''' if profile and profile.get("certificates") else ''}

            <div class="footer">
                <p>This is a computer-generated document from Unicare Polyclinic EHR System</p>
                <p>Address: Unicare Polyclinic, Kerala, India • Phone: +91-XXXX-XXXX • Email: info@unicarepolyclinic.com</p>
                <p>Generated by: {current_user.get('username', 'System')} on {datetime.utcnow().strftime('%d/%m/%Y at %H:%M IST')}</p>
            </div>
        </body>
        </html>
        """
        
        return {
            "message": "PDF content generated successfully",
            "html_content": html_content,
            "doctor_name": doctor.get('name', 'Unknown'),
            "generated_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating PDF: {str(e)}")
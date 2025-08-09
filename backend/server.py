from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional, List
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
import uuid
import logging

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
                    "default_fee": 500,
                    "phone": "9876543210",
                    "room_number": "101",
                    "created_at": datetime.utcnow()
                },
                {
                    "id": str(uuid.uuid4()),
                    "name": "Dr. John Adebayo",
                    "specialty": "Cardiology",
                    "qualification": "MBBS, DM Cardiology",
                    "default_fee": 800,
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
        # Generate OPD and Token numbers
        opd_number = await get_next_opd_number()
        token_number = await get_next_token_number()
        
        patient_dict = patient.dict()
        patient_dict["opd_number"] = opd_number
        patient_dict["token_number"] = token_number
        patient_dict["created_at"] = datetime.utcnow()
        patient_dict["updated_at"] = datetime.utcnow()
        
        result = await database.patients.insert_one(patient_dict)
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
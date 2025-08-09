from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import Optional, List
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
import uuid
import bcrypt
from jose import JWTError, jwt
import logging

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="Unicare EHR API", version="1.0.0")

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
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-here")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", 30))

# Global variables for database
mongodb_client: AsyncIOMotorClient = None
database = None

# Security
security = HTTPBearer()

# Pydantic models
class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class Patient(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_name: str
    age: str
    dob: str = ""
    sex: str
    address: str = ""
    phone_number: str
    opd_number: str = ""
    token_number: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Doctor(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    default_fee: int
    specialty: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

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
        
        # Initialize default doctors if not exist
        existing_doctors = await database.doctors.count_documents({})
        if existing_doctors == 0:
            default_doctors = [
                {"id": str(uuid.uuid4()), "name": "Dr. Emily Carter", "default_fee": 150, "specialty": "General Medicine", "created_at": datetime.utcnow()},
                {"id": str(uuid.uuid4()), "name": "Dr. John Adebayo", "default_fee": 200, "specialty": "Cardiology", "created_at": datetime.utcnow()}
            ]
            await database.doctors.insert_many(default_doctors)
            logging.info("Default doctors created")
            
    except Exception as e:
        logging.error(f"Error connecting to MongoDB: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_db_client():
    global mongodb_client
    if mongodb_client:
        mongodb_client.close()

# Utility functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return username
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_next_opd_number():
    """Generate next OPD number in format NNN/YY"""
    current_year = datetime.utcnow().year
    year_suffix = str(current_year)[-2:]
    
    # Get the current sequence for this year
    sequence_doc = await database.sequences.find_one({"type": "opd", "year": current_year})
    
    if not sequence_doc:
        # Create new sequence for this year
        next_number = 1
        await database.sequences.insert_one({"type": "opd", "year": current_year, "current": next_number})
    else:
        # Increment existing sequence
        next_number = sequence_doc["current"] + 1
        await database.sequences.update_one(
            {"type": "opd", "year": current_year},
            {"$set": {"current": next_number}}
        )
    
    return f"{str(next_number).zfill(3)}/{year_suffix}"

async def get_next_token_number():
    """Generate next token number for today"""
    today = datetime.utcnow().date()
    
    # Get today's token sequence
    sequence_doc = await database.sequences.find_one({"type": "token", "date": today.isoformat()})
    
    if not sequence_doc:
        # Create new sequence for today
        next_number = 1
        await database.sequences.insert_one({"type": "token", "date": today.isoformat(), "current": next_number})
    else:
        # Increment existing sequence
        next_number = sequence_doc["current"] + 1
        await database.sequences.update_one(
            {"type": "token", "date": today.isoformat()},
            {"$set": {"current": next_number}}
        )
    
    return str(next_number)

# API Routes
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

@app.post("/api/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    # Simple authentication - in production, use proper password hashing
    if user_data.username == "admin" and user_data.password == "admin_007":
        access_token_expires = timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user_data.username}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

@app.get("/api/doctors", response_model=List[Doctor])
async def get_doctors(current_user: str = Depends(verify_token)):
    try:
        doctors_cursor = database.doctors.find({})
        doctors = []
        async for doctor in doctors_cursor:
            doctor['_id'] = str(doctor['_id']) if '_id' in doctor else doctor.get('id', '')
            doctors.append(Doctor(**doctor))
        return doctors
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching doctors: {str(e)}")

@app.post("/api/doctors", response_model=Doctor)
async def add_doctor(doctor: Doctor, current_user: str = Depends(verify_token)):
    try:
        doctor_dict = doctor.dict()
        doctor_dict["created_at"] = datetime.utcnow()
        result = await database.doctors.insert_one(doctor_dict)
        doctor_dict["_id"] = str(result.inserted_id)
        return Doctor(**doctor_dict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding doctor: {str(e)}")

@app.get("/api/patients", response_model=List[Patient])
async def get_patients(current_user: str = Depends(verify_token)):
    try:
        patients_cursor = database.patients.find({}).sort("created_at", -1)
        patients = []
        async for patient in patients_cursor:
            patient['_id'] = str(patient['_id']) if '_id' in patient else patient.get('id', '')
            patients.append(Patient(**patient))
        return patients
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching patients: {str(e)}")

@app.post("/api/patients", response_model=Patient)
async def add_patient(patient: Patient, current_user: str = Depends(verify_token)):
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
        patient_dict["_id"] = str(result.inserted_id)
        return Patient(**patient_dict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding patient: {str(e)}")

@app.get("/api/patients/{patient_id}", response_model=Patient)
async def get_patient(patient_id: str, current_user: str = Depends(verify_token)):
    try:
        patient = await database.patients.find_one({"id": patient_id})
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        patient['_id'] = str(patient['_id']) if '_id' in patient else patient.get('id', '')
        return Patient(**patient)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching patient: {str(e)}")

@app.put("/api/patients/{patient_id}", response_model=Patient)
async def update_patient(patient_id: str, patient: Patient, current_user: str = Depends(verify_token)):
    try:
        patient_dict = patient.dict(exclude_unset=True)
        patient_dict["updated_at"] = datetime.utcnow()
        
        result = await database.patients.update_one(
            {"id": patient_id},
            {"$set": patient_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        updated_patient = await database.patients.find_one({"id": patient_id})
        if updated_patient:
            updated_patient['_id'] = str(updated_patient['_id']) if '_id' in updated_patient else updated_patient.get('id', '')
            return Patient(**updated_patient)
        else:
            raise HTTPException(status_code=404, detail="Patient not found after update")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating patient: {str(e)}")

@app.delete("/api/patients/{patient_id}")
async def delete_patient(patient_id: str, current_user: str = Depends(verify_token)):
    try:
        result = await database.patients.delete_one({"id": patient_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Patient not found")
        return {"message": "Patient deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting patient: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
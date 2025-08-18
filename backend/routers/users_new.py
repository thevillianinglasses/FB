"""
Admin User Management APIs
Comprehensive user/staff creation with multi-role support and department mapping
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from datetime import datetime
import bcrypt
import uuid

# Import from parent directory
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import UserNew, UserCreateNew, UserUpdateNew, Doctor, DoctorCreate, Nurse, NurseCreate
from auth import verify_admin_role

router = APIRouter(prefix="/api/admin/users", tags=["Admin - Users"])

# Database dependency - we'll use the global database from server.py
def get_database():
    from server import database
    return database

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

@router.get("/", response_model=List[dict])
async def get_users(
    role: Optional[str] = None,
    department_id: Optional[str] = None,
    active_only: bool = True,
    db: AsyncIOMotorClient = Depends(get_database),
    current_user: dict = Depends(verify_admin_role)
):
    """Get all users with optional filtering"""
    
    query = {}
    if role:
        query["roles"] = role
    if department_id:
        query["department_ids"] = department_id
    if active_only:
        query["active"] = True
    
    users = []
    async for user in db.users.find(query).sort("full_name", 1):
        user_data = {
            "id": str(user["_id"]),
            "username": user["username"],
            "full_name": user["full_name"],
            "roles": user["roles"],
            "designation": user.get("designation"),
            "department_ids": user.get("department_ids", []),
            "email": user.get("email"),
            "phone": user.get("phone"),
            "active": user["active"],
            "created_at": user["created_at"],
            "last_login": user.get("last_login")
        }
        
        # Get department names
        if user_data["department_ids"]:
            departments = []
            for dept_id in user_data["department_ids"]:
                if ObjectId.is_valid(dept_id):
                    dept = await db.departments.find_one({"_id": ObjectId(dept_id)})
                    if dept:
                        departments.append({
                            "id": str(dept["_id"]),
                            "name": dept["name"],
                            "slug": dept["slug"]
                        })
            user_data["departments"] = departments
        else:
            user_data["departments"] = []
        
        users.append(user_data)
    
    return users

@router.get("/{user_id}")
async def get_user(
    user_id: str,
    db: AsyncIOMotorClient = Depends(get_database),
    current_user: dict = Depends(verify_admin_role)
):
    """Get a specific user by ID"""
    
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_data = {
        "id": str(user["_id"]),
        "username": user["username"],
        "full_name": user["full_name"],
        "roles": user["roles"],
        "designation": user.get("designation"),
        "department_ids": user.get("department_ids", []),
        "email": user.get("email"),
        "phone": user.get("phone"),
        "active": user["active"],
        "created_at": user["created_at"],
        "updated_at": user["updated_at"],
        "last_login": user.get("last_login")
    }
    
    # Get department details
    departments = []
    for dept_id in user_data["department_ids"]:
        if ObjectId.is_valid(dept_id):
            dept = await db.departments.find_one({"_id": ObjectId(dept_id)})
            if dept:
                departments.append({
                    "id": str(dept["_id"]),
                    "name": dept["name"],
                    "slug": dept["slug"]
                })
    user_data["departments"] = departments
    
    # If user is a doctor, get doctor details
    if "doctor" in user["roles"]:
        doctor = await db.doctors.find_one({"user_id": str(user["_id"])})
        if doctor:
            user_data["doctor_details"] = {
                "id": str(doctor["_id"]),
                "department_id": doctor["department_id"],
                "consultation_fee": doctor.get("consultation_fee", 0),
                "slots": doctor.get("slots", []),
                "active": doctor["active"]
            }
    
    # If user is a nurse, get nurse details
    if "nursing" in user["roles"]:
        nurse = await db.nurses.find_one({"user_id": str(user["_id"])})
        if nurse:
            user_data["nurse_details"] = {
                "id": str(nurse["_id"]),
                "department_id": nurse["department_id"],
                "shift": nurse.get("shift"),
                "active": nurse["active"]
            }
    
    return user_data

@router.post("/", response_model=dict)
async def create_user(
    user_data: UserCreateNew,
    db: AsyncIOMotorClient = Depends(get_database),
    current_user: dict = Depends(verify_admin_role)
):
    """Create a new user with multi-role support"""
    
    # Check if username already exists
    existing_user = await db.users.find_one({"username": user_data.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Validate department IDs
    valid_department_ids = []
    for dept_id in user_data.department_ids:
        if ObjectId.is_valid(dept_id):
            dept = await db.departments.find_one({"_id": ObjectId(dept_id)})
            if dept:
                valid_department_ids.append(dept_id)
            else:
                raise HTTPException(status_code=400, detail=f"Department {dept_id} not found")
        else:
            raise HTTPException(status_code=400, detail=f"Invalid department ID: {dept_id}")
    
    # Hash password
    password_hash = hash_password(user_data.password)
    
    # Create user document
    user_doc = {
        "username": user_data.username,
        "password_hash": password_hash,
        "full_name": user_data.full_name,
        "roles": user_data.roles,
        "designation": user_data.designation,
        "department_ids": valid_department_ids,
        "email": user_data.email,
        "phone": user_data.phone,
        "active": True,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "last_login": None
    }
    
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    created_records = {"user_id": user_id}
    
    # If user has doctor role, create doctor record
    if "doctor" in user_data.roles:
        # Use the first department for the doctor record (primary department)
        primary_dept_id = valid_department_ids[0] if valid_department_ids else ""
        
        doctor_doc = {
            "user_id": user_id,
            "department_id": primary_dept_id,
            "slots": [
                {"day": "monday", "start": "09:00", "end": "17:00"},
                {"day": "tuesday", "start": "09:00", "end": "17:00"},
                {"day": "wednesday", "start": "09:00", "end": "17:00"},
                {"day": "thursday", "start": "09:00", "end": "17:00"},
                {"day": "friday", "start": "09:00", "end": "17:00"},
                {"day": "saturday", "start": "09:00", "end": "13:00"}
            ],
            "consultation_fee": 500.0,
            "active": True,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        doctor_result = await db.doctors.insert_one(doctor_doc)
        created_records["doctor_id"] = str(doctor_result.inserted_id)
    
    # If user has nursing role, create nurse record
    if "nursing" in user_data.roles:
        # Use the first department for the nurse record (primary department)
        primary_dept_id = valid_department_ids[0] if valid_department_ids else ""
        
        nurse_doc = {
            "user_id": user_id,
            "department_id": primary_dept_id,
            "shift": "morning",  # Default shift
            "active": True,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        nurse_result = await db.nurses.insert_one(nurse_doc)
        created_records["nurse_id"] = str(nurse_result.inserted_id)
    
    # Fetch the created user with details
    return await get_user(user_id, db, current_user)

@router.patch("/{user_id}")
async def update_user(
    user_id: str,
    user_data: UserUpdateNew,
    db: AsyncIOMotorClient = Depends(get_database),
    current_user: dict = Depends(verify_admin_role)
):
    """Update an existing user"""
    
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    # Check if user exists
    existing_user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prepare update data
    update_data = {"updated_at": datetime.now()}
    
    # Update basic fields
    if user_data.full_name is not None:
        update_data["full_name"] = user_data.full_name
    if user_data.designation is not None:
        update_data["designation"] = user_data.designation
    if user_data.email is not None:
        update_data["email"] = user_data.email
    if user_data.phone is not None:
        update_data["phone"] = user_data.phone
    if user_data.active is not None:
        update_data["active"] = user_data.active
    
    # Handle role changes
    if user_data.roles is not None:
        old_roles = set(existing_user.get("roles", []))
        new_roles = set(user_data.roles)
        update_data["roles"] = user_data.roles
        
        # If doctor role was added, create doctor record
        if "doctor" in new_roles and "doctor" not in old_roles:
            primary_dept_id = user_data.department_ids[0] if user_data.department_ids else ""
            doctor_doc = {
                "user_id": user_id,
                "department_id": primary_dept_id,
                "slots": [
                    {"day": "monday", "start": "09:00", "end": "17:00"},
                    {"day": "tuesday", "start": "09:00", "end": "17:00"},
                    {"day": "wednesday", "start": "09:00", "end": "17:00"},
                    {"day": "thursday", "start": "09:00", "end": "17:00"},
                    {"day": "friday", "start": "09:00", "end": "17:00"},
                    {"day": "saturday", "start": "09:00", "end": "13:00"}
                ],
                "consultation_fee": 500.0,
                "active": True,
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
            await db.doctors.insert_one(doctor_doc)
        
        # If doctor role was removed, deactivate doctor record
        elif "doctor" in old_roles and "doctor" not in new_roles:
            await db.doctors.update_one(
                {"user_id": user_id},
                {"$set": {"active": False, "updated_at": datetime.now()}}
            )
        
        # If nursing role was added, create nurse record
        if "nursing" in new_roles and "nursing" not in old_roles:
            primary_dept_id = user_data.department_ids[0] if user_data.department_ids else ""
            nurse_doc = {
                "user_id": user_id,
                "department_id": primary_dept_id,
                "shift": "morning",
                "active": True,
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
            await db.nurses.insert_one(nurse_doc)
        
        # If nursing role was removed, deactivate nurse record
        elif "nursing" in old_roles and "nursing" not in new_roles:
            await db.nurses.update_one(
                {"user_id": user_id},
                {"$set": {"active": False, "updated_at": datetime.now()}}
            )
    
    # Handle department changes
    if user_data.department_ids is not None:
        # Validate department IDs
        valid_department_ids = []
        for dept_id in user_data.department_ids:
            if ObjectId.is_valid(dept_id):
                dept = await db.departments.find_one({"_id": ObjectId(dept_id)})
                if dept:
                    valid_department_ids.append(dept_id)
                else:
                    raise HTTPException(status_code=400, detail=f"Department {dept_id} not found")
            else:
                raise HTTPException(status_code=400, detail=f"Invalid department ID: {dept_id}")
        
        update_data["department_ids"] = valid_department_ids
        
        # Update primary department for doctor/nurse records
        if valid_department_ids:
            primary_dept_id = valid_department_ids[0]
            
            # Update doctor record if exists
            await db.doctors.update_one(
                {"user_id": user_id, "active": True},
                {"$set": {"department_id": primary_dept_id, "updated_at": datetime.now()}}
            )
            
            # Update nurse record if exists
            await db.nurses.update_one(
                {"user_id": user_id, "active": True},
                {"$set": {"department_id": primary_dept_id, "updated_at": datetime.now()}}
            )
    
    # Update the user
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    
    # Return updated user
    return await get_user(user_id, db, current_user)

@router.post("/{user_id}/reset-password")
async def reset_password(
    user_id: str,
    new_password: str,
    db: AsyncIOMotorClient = Depends(get_database),
    current_user: dict = Depends(verify_admin_role)
):
    """Reset user password"""
    
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    # Check if user exists
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Hash new password
    password_hash = hash_password(new_password)
    
    # Update password
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"password_hash": password_hash, "updated_at": datetime.now()}}
    )
    
    return {"message": "Password reset successfully"}

@router.get("/doctors/", response_model=List[dict])
async def get_doctors(
    department_id: Optional[str] = None,
    active_only: bool = True,
    db: AsyncIOMotorClient = Depends(get_database)
):
    """Get all doctors with optional department filtering (public endpoint for reception)"""
    
    query = {}
    if department_id:
        query["department_id"] = department_id
    if active_only:
        query["active"] = True
    
    doctors = []
    async for doctor in db.doctors.find(query):
        # Get user details for this doctor
        user = await db.users.find_one({"_id": ObjectId(doctor["user_id"])})
        if user and user["active"]:
            # Get department details
            department = await db.departments.find_one({"_id": ObjectId(doctor["department_id"])})
            
            doctor_data = {
                "id": str(doctor["_id"]),
                "user_id": str(user["_id"]),
                "name": user["full_name"],
                "designation": user.get("designation", "Doctor"),
                "department": {
                    "id": str(department["_id"]) if department else "",
                    "name": department["name"] if department else "",
                    "slug": department["slug"] if department else ""
                } if department else None,
                "consultation_fee": doctor.get("consultation_fee", 0),
                "slots": doctor.get("slots", []),
                "active": doctor["active"]
            }
            doctors.append(doctor_data)
    
    return doctors

@router.get("/nurses/", response_model=List[dict])
async def get_nurses(
    department_id: Optional[str] = None,
    active_only: bool = True,
    db: AsyncIOMotorClient = Depends(get_database)
):
    """Get all nurses with optional department filtering"""
    
    query = {}
    if department_id:
        query["department_id"] = department_id
    if active_only:
        query["active"] = True
    
    nurses = []
    async for nurse in db.nurses.find(query):
        # Get user details for this nurse
        user = await db.users.find_one({"_id": ObjectId(nurse["user_id"])})
        if user and user["active"]:
            # Get department details
            department = await db.departments.find_one({"_id": ObjectId(nurse["department_id"])})
            
            nurse_data = {
                "id": str(nurse["_id"]),
                "user_id": str(user["_id"]),
                "name": user["full_name"],
                "designation": user.get("designation", "Nurse"),
                "department": {
                    "id": str(department["_id"]) if department else "",
                    "name": department["name"] if department else "",
                    "slug": department["slug"] if department else ""
                } if department else None,
                "shift": nurse.get("shift", ""),
                "active": nurse["active"]
            }
            nurses.append(nurse_data)
    
    return nurses
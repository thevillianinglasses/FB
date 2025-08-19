"""
Admin Department Management APIs
Comprehensive CRUD operations with slug auto-generation
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from datetime import datetime
import re
import uuid

# Import from parent directory
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import Department, DepartmentCreate, DepartmentUpdate
from auth import get_admin_user

# Get the admin dependency function
verify_admin_role = get_admin_user()

router = APIRouter(prefix="/api/admin/departments", tags=["Admin - Departments"])

# Database dependency - we'll use the global database from server.py
def get_database():
    from server import database
    return database

def generate_slug(name: str) -> str:
    """Generate URL-friendly slug from department name"""
    # Convert to lowercase and replace spaces/special chars with underscores
    slug = re.sub(r'[^a-zA-Z0-9\s]', '', name.lower())
    slug = re.sub(r'\s+', '_', slug.strip())
    return slug

@router.get("/", response_model=List[Department])
async def get_departments(
    active_only: bool = False,
    current_user: dict = Depends(verify_admin_role)
):
    """Get all departments with optional filtering by active status"""
    
    db = get_database()
    query = {}
    if active_only:
        query["active"] = True
    
    departments = []
    async for dept in db.departments.find(query).sort("name", 1):
        dept["id"] = str(dept["_id"])
        del dept["_id"]
        
        # Handle missing fields for backward compatibility
        if "slug" not in dept:
            dept["slug"] = generate_slug(dept.get("name", ""))
        if "active" not in dept:
            # Map status to active for backward compatibility
            dept["active"] = dept.get("status") == "active"
            
        departments.append(Department(**dept))
    
    return departments

@router.get("/{department_id}", response_model=Department)
async def get_department(
    department_id: str,
    current_user: dict = Depends(verify_admin_role)
):
    """Get a specific department by ID"""
    
    db = get_database()
    if not ObjectId.is_valid(department_id):
        raise HTTPException(status_code=400, detail="Invalid department ID")
    
    dept = await db.departments.find_one({"_id": ObjectId(department_id)})
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    
    dept["id"] = str(dept["_id"])
    del dept["_id"]
    return Department(**dept)

@router.post("/", response_model=Department)
async def create_department(
    department_data: DepartmentCreate,
    current_user: dict = Depends(verify_admin_role)
):
    """Create a new department with auto-generated slug"""
    
    db = get_database()
    # Generate slug from name
    slug = generate_slug(department_data.name)
    
    # Check if slug already exists
    existing = await db.departments.find_one({"slug": slug})
    if existing:
        # If slug exists, add a number suffix
        counter = 1
        while existing:
            new_slug = f"{slug}_{counter}"
            existing = await db.departments.find_one({"slug": new_slug})
            counter += 1
        slug = new_slug
    
    # Create department document
    dept_doc = {
        "name": department_data.name,
        "slug": slug,
        "active": department_data.active,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    
    result = await db.departments.insert_one(dept_doc)
    
    # Fetch the created department
    created_dept = await db.departments.find_one({"_id": result.inserted_id})
    created_dept["id"] = str(created_dept["_id"])
    del created_dept["_id"]
    
    # TODO: Emit cache invalidation event for Reception/Doctor modules
    
    return Department(**created_dept)

@router.patch("/{department_id}", response_model=Department)
async def update_department(
    department_id: str,
    department_data: DepartmentUpdate,
    current_user: dict = Depends(verify_admin_role)
):
    """Update an existing department"""
    
    db = get_database()
    if not ObjectId.is_valid(department_id):
        raise HTTPException(status_code=400, detail="Invalid department ID")
    
    # Check if department exists
    existing_dept = await db.departments.find_one({"_id": ObjectId(department_id)})
    if not existing_dept:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Prepare update data
    update_data = {"updated_at": datetime.now()}
    
    if department_data.name is not None:
        update_data["name"] = department_data.name
        # Regenerate slug if name changed
        new_slug = generate_slug(department_data.name)
        existing_slug = existing_dept.get("slug", "")
        if new_slug != existing_slug:
            # Check if new slug is available
            slug_conflict = await db.departments.find_one({
                "slug": new_slug,
                "_id": {"$ne": ObjectId(department_id)}
            })
            if slug_conflict:
                counter = 1
                while slug_conflict:
                    test_slug = f"{new_slug}_{counter}"
                    slug_conflict = await db.departments.find_one({
                        "slug": test_slug,
                        "_id": {"$ne": ObjectId(department_id)}
                    })
                    counter += 1
                new_slug = test_slug
            update_data["slug"] = new_slug
    
    if department_data.active is not None:
        update_data["active"] = department_data.active
    
    # Update the department
    await db.departments.update_one(
        {"_id": ObjectId(department_id)},
        {"$set": update_data}
    )
    
    # Fetch updated department
    updated_dept = await db.departments.find_one({"_id": ObjectId(department_id)})
    updated_dept["id"] = str(updated_dept["_id"])
    del updated_dept["_id"]
    
    # TODO: Emit cache invalidation event
    
    return Department(**updated_dept)

@router.get("/{department_id}/staff")
async def get_department_staff(
    department_id: str,
    current_user: dict = Depends(verify_admin_role)
):
    """Get all staff members assigned to a department"""
    
    db = get_database()
    if not ObjectId.is_valid(department_id):
        raise HTTPException(status_code=400, detail="Invalid department ID")
    
    # Get department info
    department = await db.departments.find_one({"_id": ObjectId(department_id)})
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    staff = {
        "department": {
            "id": str(department["_id"]),
            "name": department["name"],
            "slug": department.get("slug", "")
        },
        "doctors": [],
        "nurses": [],
        "other_staff": []
    }
    
    # Get doctors
    doctors_cursor = db.doctors.find({"department_id": department_id, "active": True})
    async for doctor in doctors_cursor:
        # Get user info for this doctor if available
        user = await db.users.find_one({"_id": ObjectId(doctor.get("user_id", ""))}) if doctor.get("user_id") else None
        if user:
            staff["doctors"].append({
                "id": str(doctor["_id"]),
                "user_id": str(user["_id"]),
                "name": user["full_name"],
                "designation": user.get("designation", "Doctor"),
                "consultation_fee": doctor.get("consultation_fee", 0),
                "slots": doctor.get("slots", [])
            })
        else:
            # Use doctor data directly if no user record
            staff["doctors"].append({
                "id": str(doctor["_id"]),
                "user_id": "",
                "name": doctor.get("name", "Unknown Doctor"),
                "designation": "Doctor",
                "consultation_fee": doctor.get("default_fee", 0),
                "slots": []
            })
    
    # Get nurses (if nurses collection exists)
    try:
        nurses_cursor = db.nurses.find({"department_id": department_id, "active": True})
        async for nurse in nurses_cursor:
            # Get user info for this nurse
            user = await db.users.find_one({"_id": ObjectId(nurse.get("user_id", ""))}) if nurse.get("user_id") else None
            if user:
                staff["nurses"].append({
                    "id": str(nurse["_id"]),
                    "user_id": str(user["_id"]),
                    "name": user["full_name"],
                    "designation": user.get("designation", "Nurse"),
                    "shift": nurse.get("shift", "")
                })
    except:
        # Nurses collection might not exist yet
        pass
    
    # Get other staff (users with this department in their department_ids)
    try:
        other_staff_cursor = db.users.find({
            "department_ids": department_id,
            "active": True,
            "roles": {"$nin": ["doctor", "nursing"]}  # Exclude doctors and nurses (already listed above)
        })
        async for user in other_staff_cursor:
            staff["other_staff"].append({
                "id": str(user["_id"]),
                "name": user["full_name"],
                "roles": user["roles"],
                "designation": user.get("designation", "")
            })
    except:
        # Users collection might not have department_ids field yet
        pass
    
    return staff
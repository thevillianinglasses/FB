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

from ..models import Department, DepartmentCreate, DepartmentUpdate
from ..deps.db import get_database
from ..auth import verify_admin_role

router = APIRouter(prefix="/api/admin/departments", tags=["Admin - Departments"])

def generate_slug(name: str) -> str:
    """Generate URL-friendly slug from department name"""
    # Convert to lowercase and replace spaces/special chars with underscores
    slug = re.sub(r'[^a-zA-Z0-9\s]', '', name.lower())
    slug = re.sub(r'\s+', '_', slug.strip())
    return slug

@router.get("/", response_model=List[Department])
async def get_departments(
    active_only: bool = False,
    db: AsyncIOMotorClient = Depends(get_database),
    current_user: dict = Depends(verify_admin_role)
):
    """Get all departments with optional filtering by active status"""
    
    query = {}
    if active_only:
        query["active"] = True
    
    departments = []
    async for dept in db.departments.find(query).sort("name", 1):
        dept["id"] = str(dept["_id"])
        del dept["_id"]
        departments.append(Department(**dept))
    
    return departments

@router.get("/{department_id}", response_model=Department)
async def get_department(
    department_id: str,
    db: AsyncIOMotorClient = Depends(get_database),
    current_user: dict = Depends(verify_admin_role)
):
    """Get a specific department by ID"""
    
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
    db: AsyncIOMotorClient = Depends(get_database),
    current_user: dict = Depends(verify_admin_role)
):
    """Create a new department with auto-generated slug"""
    
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
    db: AsyncIOMotorClient = Depends(get_database),
    current_user: dict = Depends(verify_admin_role)
):
    """Update an existing department"""
    
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
        if new_slug != existing_dept["slug"]:
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

@router.delete("/{department_id}")
async def delete_department(
    department_id: str,
    force: bool = False,
    db: AsyncIOMotorClient = Depends(get_database),
    current_user: dict = Depends(verify_admin_role)
):
    """Delete or deactivate a department (prevent delete if doctors exist)"""
    
    if not ObjectId.is_valid(department_id):
        raise HTTPException(status_code=400, detail="Invalid department ID")
    
    # Check if department exists
    existing_dept = await db.departments.find_one({"_id": ObjectId(department_id)})
    if not existing_dept:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Check if any doctors are assigned to this department
    doctors_count = await db.doctors.count_documents({
        "department_id": department_id,
        "active": True
    })
    
    # Check if any nurses are assigned to this department
    nurses_count = await db.nurses.count_documents({
        "department_id": department_id,
        "active": True
    })
    
    # Check if any users are assigned to this department
    users_count = await db.users.count_documents({
        "department_ids": department_id,
        "active": True
    })
    
    total_staff = doctors_count + nurses_count + users_count
    
    if total_staff > 0 and not force:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete department. {total_staff} staff members are assigned. Use deactivate instead."
        )
    
    if force:
        # Force delete - remove department and update all references
        await db.departments.delete_one({"_id": ObjectId(department_id)})
        
        # Remove department from all user department_ids arrays
        await db.users.update_many(
            {"department_ids": department_id},
            {"$pull": {"department_ids": department_id}}
        )
        
        # Deactivate all doctors in this department
        await db.doctors.update_many(
            {"department_id": department_id},
            {"$set": {"active": False, "updated_at": datetime.now()}}
        )
        
        # Deactivate all nurses in this department
        await db.nurses.update_many(
            {"department_id": department_id},
            {"$set": {"active": False, "updated_at": datetime.now()}}
        )
        
        return {"message": "Department deleted successfully", "staff_affected": total_staff}
    
    else:
        # Safe delete - just deactivate
        await db.departments.update_one(
            {"_id": ObjectId(department_id)},
            {"$set": {"active": False, "updated_at": datetime.now()}}
        )
        
        return {"message": "Department deactivated successfully", "staff_count": total_staff}

@router.post("/{department_id}/activate")
async def activate_department(
    department_id: str,
    db: AsyncIOMotorClient = Depends(get_database),
    current_user: dict = Depends(verify_admin_role)
):
    """Activate a deactivated department"""
    
    if not ObjectId.is_valid(department_id):
        raise HTTPException(status_code=400, detail="Invalid department ID")
    
    result = await db.departments.update_one(
        {"_id": ObjectId(department_id)},
        {"$set": {"active": True, "updated_at": datetime.now()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Department not found")
    
    return {"message": "Department activated successfully"}

@router.get("/{department_id}/staff")
async def get_department_staff(
    department_id: str,
    db: AsyncIOMotorClient = Depends(get_database),
    current_user: dict = Depends(verify_admin_role)
):
    """Get all staff members assigned to a department"""
    
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
            "slug": department["slug"]
        },
        "doctors": [],
        "nurses": [],
        "other_staff": []
    }
    
    # Get doctors
    doctors_cursor = db.doctors.find({"department_id": department_id, "active": True})
    async for doctor in doctors_cursor:
        # Get user info for this doctor
        user = await db.users.find_one({"_id": ObjectId(doctor["user_id"])})
        if user:
            staff["doctors"].append({
                "id": str(doctor["_id"]),
                "user_id": str(user["_id"]),
                "name": user["full_name"],
                "designation": user.get("designation", "Doctor"),
                "consultation_fee": doctor.get("consultation_fee", 0),
                "slots": doctor.get("slots", [])
            })
    
    # Get nurses
    nurses_cursor = db.nurses.find({"department_id": department_id, "active": True})
    async for nurse in nurses_cursor:
        # Get user info for this nurse
        user = await db.users.find_one({"_id": ObjectId(nurse["user_id"])})
        if user:
            staff["nurses"].append({
                "id": str(nurse["_id"]),
                "user_id": str(user["_id"]),
                "name": user["full_name"],
                "designation": user.get("designation", "Nurse"),
                "shift": nurse.get("shift", "")
            })
    
    # Get other staff (users with this department in their department_ids)
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
    
    return staff
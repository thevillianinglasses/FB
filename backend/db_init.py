#!/usr/bin/env python3
"""
Database Initialization Script for Comprehensive EHR System
Creates all necessary MongoDB collections with indexes
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import OperationFailure
import bcrypt
from datetime import datetime
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# All departments with their slugs
DEPARTMENTS = [
    {"name": "General Medicine", "slug": "general_medicine"},
    {"name": "General Surgery", "slug": "general_surgery"},
    {"name": "Rheumatology", "slug": "rheumatology"},
    {"name": "Cardiology", "slug": "cardiology"},
    {"name": "Neurology", "slug": "neurology"},
    {"name": "Neurosurgery", "slug": "neurosurgery"},
    {"name": "Gastro Surgery", "slug": "gastro_surgery"},
    {"name": "Orthopedics", "slug": "orthopedics"},
    {"name": "Primary Care", "slug": "primary_care"},
    {"name": "Family Medicine", "slug": "family_medicine"},
    {"name": "ENT", "slug": "ent"},
    {"name": "Ophthalmology", "slug": "ophthalmology"},
    {"name": "Dermatology", "slug": "dermatology"},
    {"name": "Aesthetic Medicine", "slug": "aesthetic_medicine"},
    {"name": "Anesthesiology", "slug": "anesthesiology"},
    {"name": "Emergency Medicine", "slug": "emergency_medicine"},
    {"name": "Radiology", "slug": "radiology"},
    {"name": "Gastroenterology", "slug": "gastroenterology"},
    {"name": "Hepatology", "slug": "hepatology"},
    {"name": "Palliative Medicine", "slug": "palliative_medicine"},
    {"name": "Laboratory", "slug": "laboratory"},
    {"name": "Pharmacy", "slug": "pharmacy"},
    {"name": "Nursing", "slug": "nursing"},
    {"name": "Reception", "slug": "reception"}
]

async def init_database():
    """Initialize the database with collections and indexes"""
    
    # Get MongoDB connection
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/unicare')
    client = AsyncIOMotorClient(mongo_url)
    
    # Extract database name from URL
    db_name = mongo_url.split('/')[-1] if '/' in mongo_url else 'unicare'
    db = client[db_name]
    
    logger.info(f"Initializing database: {db_name}")
    
    # ===== CREATE COLLECTIONS WITH INDEXES =====
    
    # 1. Departments Collection
    logger.info("Creating departments collection...")
    departments_collection = db.departments
    
    # Create unique index on slug
    try:
        await departments_collection.create_index("slug", unique=True)
        logger.info("✅ Created unique index on departments.slug")
    except OperationFailure as e:
        logger.warning(f"Index creation failed: {e}")
    
    # Insert all departments
    departments_to_insert = []
    for dept in DEPARTMENTS:
        departments_to_insert.append({
            **dept,
            "active": True,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        })
    
    # Check if departments already exist
    existing_count = await departments_collection.count_documents({})
    if existing_count == 0:
        await departments_collection.insert_many(departments_to_insert)
        logger.info(f"✅ Inserted {len(departments_to_insert)} departments")
    else:
        logger.info(f"ℹ️ Departments already exist ({existing_count} documents)")
    
    # 2. Users Collection
    logger.info("Creating users collection...")
    users_collection = db.users
    
    # Create unique index on username
    try:
        await users_collection.create_index("username", unique=True)
        logger.info("✅ Created unique index on users.username")
    except OperationFailure as e:
        logger.warning(f"Index creation failed: {e}")
    
    # Create compound index on roles and active status
    try:
        await users_collection.create_index([("roles", 1), ("active", 1)])
        logger.info("✅ Created compound index on users.roles and active")
    except OperationFailure as e:
        logger.warning(f"Index creation failed: {e}")
    
    # 3. Doctors Collection
    logger.info("Creating doctors collection...")
    doctors_collection = db.doctors
    
    # Create indexes
    try:
        await doctors_collection.create_index("user_id")
        await doctors_collection.create_index("department_id")
        await doctors_collection.create_index([("department_id", 1), ("active", 1)])
        logger.info("✅ Created indexes on doctors collection")
    except OperationFailure as e:
        logger.warning(f"Index creation failed: {e}")
    
    # 4. Nurses Collection
    logger.info("Creating nurses collection...")
    nurses_collection = db.nurses
    
    # Create indexes
    try:
        await nurses_collection.create_index("user_id")
        await nurses_collection.create_index("department_id")
        await nurses_collection.create_index([("department_id", 1), ("active", 1)])
        logger.info("✅ Created indexes on nurses collection")
    except OperationFailure as e:
        logger.warning(f"Index creation failed: {e}")
    
    # 5. Patients Collection
    logger.info("Creating patients collection...")
    patients_collection = db.patients
    
    # Create unique index on opd_no
    try:
        await patients_collection.create_index("opd_no", unique=True)
        logger.info("✅ Created unique index on patients.opd_no")
    except OperationFailure as e:
        logger.warning(f"Index creation failed: {e}")
    
    # Create index on phone for quick patient lookup
    try:
        await patients_collection.create_index("phone")
        logger.info("✅ Created index on patients.phone")
    except OperationFailure as e:
        logger.warning(f"Index creation failed: {e}")
    
    # 6. Encounters Collection
    logger.info("Creating encounters collection...")
    encounters_collection = db.encounters
    
    # Create indexes
    try:
        await encounters_collection.create_index("patient_id")
        await encounters_collection.create_index("department_id")
        await encounters_collection.create_index("created_by")
        await encounters_collection.create_index([("patient_id", 1), ("created_at", -1)])
        logger.info("✅ Created indexes on encounters collection")
    except OperationFailure as e:
        logger.warning(f"Index creation failed: {e}")
    
    # 7. Vitals Collection
    logger.info("Creating vitals collection...")
    vitals_collection = db.vitals
    
    # Create indexes
    try:
        await vitals_collection.create_index("patient_id")
        await vitals_collection.create_index("recorded_by")
        await vitals_collection.create_index([("patient_id", 1), ("recorded_at", -1)])
        logger.info("✅ Created indexes on vitals collection")
    except OperationFailure as e:
        logger.warning(f"Index creation failed: {e}")
    
    # 8. Consult Requests Collection
    logger.info("Creating consult_requests collection...")
    consult_requests_collection = db.consult_requests
    
    # Create indexes
    try:
        await consult_requests_collection.create_index("patient_id")
        await consult_requests_collection.create_index("from_department_id")
        await consult_requests_collection.create_index("to_department_id")
        await consult_requests_collection.create_index("status")
        await consult_requests_collection.create_index([("to_department_id", 1), ("status", 1)])
        logger.info("✅ Created indexes on consult_requests collection")
    except OperationFailure as e:
        logger.warning(f"Index creation failed: {e}")
    
    # 9. OPD Counter Collection (for unique OPD numbers)
    logger.info("Creating opd_counter collection...")
    opd_counter_collection = db.opd_counter
    
    # Initialize OPD counter if it doesn't exist
    existing_counter = await opd_counter_collection.find_one({"_id": "opd_sequence"})
    if not existing_counter:
        await opd_counter_collection.insert_one({
            "_id": "opd_sequence",
            "sequence_value": 1000  # Start from OPD-1001
        })
        logger.info("✅ Initialized OPD counter")
    
    # ===== CREATE DEFAULT ADMIN USER =====
    
    # Check if admin user exists
    admin_user = await users_collection.find_one({"username": "admin"})
    if not admin_user:
        # Hash the password
        password_hash = bcrypt.hashpw("admin_007".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Create admin user
        admin_data = {
            "username": "admin",
            "password_hash": password_hash,
            "full_name": "System Administrator",
            "roles": ["admin"],
            "designation": "Administrator",
            "department_ids": [],  # Admin can access all departments
            "email": "admin@unicare.com",
            "phone": None,
            "active": True,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "last_login": None
        }
        
        await users_collection.insert_one(admin_data)
        logger.info("✅ Created default admin user (admin/admin_007)")
    else:
        logger.info("ℹ️ Admin user already exists")
    
    # ===== CREATE SAMPLE USERS FOR TESTING =====
    
    # Get some department IDs for sample users
    general_medicine = await departments_collection.find_one({"slug": "general_medicine"})
    cardiology = await departments_collection.find_one({"slug": "cardiology"})
    pharmacy = await departments_collection.find_one({"slug": "pharmacy"})
    laboratory = await departments_collection.find_one({"slug": "laboratory"})
    nursing = await departments_collection.find_one({"slug": "nursing"})
    reception = await departments_collection.find_one({"slug": "reception"})
    
    # Sample users data
    sample_users = [
        {
            "username": "reception1",
            "password": "reception123",
            "full_name": "Reception Staff",
            "roles": ["reception"],
            "designation": "Receptionist",
            "department_ids": [str(reception["_id"])] if reception else [],
        },
        {
            "username": "pharmacy1", 
            "password": "pharmacy123",
            "full_name": "Pharmacy Staff",
            "roles": ["pharmacy"],
            "designation": "Pharmacist",
            "department_ids": [str(pharmacy["_id"])] if pharmacy else [],
        },
        {
            "username": "lab1",
            "password": "lab123", 
            "full_name": "Laboratory Technician",
            "roles": ["laboratory"],
            "designation": "Lab Technician",
            "department_ids": [str(laboratory["_id"])] if laboratory else [],
        },
        {
            "username": "nurse1",
            "password": "nurse123",
            "full_name": "Head Nurse",
            "roles": ["nursing"],
            "designation": "Staff Nurse",
            "department_ids": [str(nursing["_id"])] if nursing else [],
        },
        {
            "username": "doctor1",
            "password": "doctor123",
            "full_name": "Dr. John Smith",
            "roles": ["doctor"],
            "designation": "Consultant",
            "department_ids": [str(general_medicine["_id"])] if general_medicine else [],
        },
        {
            "username": "doctor2",
            "password": "doctor123",
            "full_name": "Dr. Sarah Wilson",
            "roles": ["doctor"],
            "designation": "Cardiologist",
            "department_ids": [str(cardiology["_id"])] if cardiology else [],
        }
    ]
    
    # Create sample users if they don't exist
    for user_data in sample_users:
        existing_user = await users_collection.find_one({"username": user_data["username"]})
        if not existing_user:
            # Hash password
            password_hash = bcrypt.hashpw(user_data["password"].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            user_doc = {
                "username": user_data["username"],
                "password_hash": password_hash,
                "full_name": user_data["full_name"],
                "roles": user_data["roles"],
                "designation": user_data["designation"],
                "department_ids": user_data["department_ids"],
                "email": None,
                "phone": None,
                "active": True,
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "last_login": None
            }
            
            result = await users_collection.insert_one(user_doc)
            logger.info(f"✅ Created user: {user_data['username']}")
            
            # If user is a doctor, create doctor record
            if "doctor" in user_data["roles"]:
                doctor_doc = {
                    "user_id": str(result.inserted_id),
                    "department_id": user_data["department_ids"][0] if user_data["department_ids"] else "",
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
                await doctors_collection.insert_one(doctor_doc)
                logger.info(f"✅ Created doctor record for: {user_data['username']}")
            
            # If user is a nurse, create nurse record
            elif "nursing" in user_data["roles"]:
                nurse_doc = {
                    "user_id": str(result.inserted_id),
                    "department_id": user_data["department_ids"][0] if user_data["department_ids"] else "",
                    "shift": "morning",
                    "active": True,
                    "created_at": datetime.now(),
                    "updated_at": datetime.now()
                }
                await nurses_collection.insert_one(nurse_doc)
                logger.info(f"✅ Created nurse record for: {user_data['username']}")
        else:
            logger.info(f"ℹ️ User {user_data['username']} already exists")
    
    logger.info("🎉 Database initialization completed successfully!")
    
    # Print summary
    logger.info("=== SUMMARY ===")
    departments_count = await departments_collection.count_documents({})
    users_count = await users_collection.count_documents({})
    doctors_count = await doctors_collection.count_documents({})
    nurses_count = await nurses_collection.count_documents({})
    
    logger.info(f"📊 Departments: {departments_count}")
    logger.info(f"👥 Users: {users_count}")
    logger.info(f"👨‍⚕️ Doctors: {doctors_count}")
    logger.info(f"👩‍⚕️ Nurses: {nurses_count}")
    
    await client.close()

if __name__ == "__main__":
    asyncio.run(init_database())
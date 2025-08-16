from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    RECEPTION = "reception"
    LABORATORY = "laboratory"
    PHARMACY = "pharmacy"
    NURSING = "nursing"
    DOCTOR = "doctor"

class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

class TestStatus(str, Enum):
    PENDING = "pending"
    COLLECTED = "collected"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    REPORTED = "reported"

class PrescriptionStatus(str, Enum):
    PENDING = "pending"
    DISPENSED = "dispensed"
    PARTIAL = "partial"
    CANCELLED = "cancelled"

class AppointmentStatus(str, Enum):
    SCHEDULED = "Scheduled"
    CONFIRMED = "Confirmed" 
    CHECKED_IN = "Checked In"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"
    NO_SHOW = "No Show"

# User Management Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    password_hash: str = ""
    full_name: str
    role: UserRole
    department: str = ""
    email: str = ""
    phone: str = ""
    status: UserStatus = UserStatus.ACTIVE
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    role: UserRole
    department: str = ""
    email: str = ""
    phone: str = ""

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_role: str
    user_name: str

# Patient Models (Enhanced)
class Patient(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_name: str
    age: str
    dob: str = ""
    sex: str
    address: str = ""
    phone_number: str
    email: str = ""
    emergency_contact_name: str = ""
    emergency_contact_phone: str = ""
    allergies: str = ""
    medical_history: str = ""
    assigned_doctor: str = ""  # Doctor ID
    visit_type: str = "New"
    patient_rating: int = 0
    department: str = ""
    consultation_fee: str = ""
    total_visits: int = 1
    opd_number: str = ""
    token_number: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Enhanced Doctor Models for Admin Management
class DoctorCertificate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    certificate_name: str
    file_path: str
    file_name: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

class DoctorProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    doctor_id: str  # Links to Doctor.id
    degree: str = ""
    registration_number: str = ""
    address: str = ""
    phone: str = ""
    email: str = ""
    certificates: List[DoctorCertificate] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Doctor Models
class Doctor(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    specialty: str = ""
    qualification: str = ""
    registration_number: str = ""
    default_fee: str = "150"  # Default consultation fee
    phone: str = ""
    email: str = ""
    address: str = ""
    degree: str = ""
    schedule: str = ""
    room_number: str = ""
    status: str = "active"
    has_profile: bool = False  # Indicates if detailed profile exists
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class DoctorCreate(BaseModel):
    name: str
    specialty: str = ""
    qualification: str = ""
    default_fee: str = "500"
    phone: str = ""
    email: str = ""

class DoctorUpdate(BaseModel):
    name: Optional[str] = None
    specialty: Optional[str] = None
    qualification: Optional[str] = None
    registration_number: Optional[str] = None
    default_fee: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    degree: Optional[str] = None
    schedule: Optional[str] = None
    room_number: Optional[str] = None
    status: Optional[str] = None

# Appointment Models
class Appointment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_name: str
    phone_number: str
    patient_details: Optional[dict] = {"age": "", "sex": "", "address": ""}
    doctor_id: str
    appointment_date: str  # YYYY-MM-DD format
    appointment_time: str  # HH:MM format
    duration: str = "30"  # minutes
    reason: str = ""
    type: str = "Consultation"  # Consultation, Follow-up, Procedure
    status: AppointmentStatus = AppointmentStatus.SCHEDULED
    notes: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
class AppointmentCreate(BaseModel):
    patient_name: str
    phone_number: str
    patient_details: Optional[dict] = {"age": "", "sex": "", "address": ""}
    doctor_id: str
    appointment_date: str
    appointment_time: str
    duration: str = "30"
    reason: str = ""
    type: str = "Consultation"
    notes: str = ""
    
class AppointmentUpdate(BaseModel):
    patient_name: Optional[str] = None
    phone_number: Optional[str] = None
    patient_details: Optional[dict] = None
    doctor_id: Optional[str] = None
    appointment_date: Optional[str] = None
    appointment_time: Optional[str] = None
    duration: Optional[str] = None
    reason: Optional[str] = None
    type: Optional[str] = None
    status: Optional[AppointmentStatus] = None
    notes: Optional[str] = None
    
# Vital Signs Models for Nursing Integration
class VitalSigns(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str  # Links to Patient.id or OPD number
    patient_name: str
    age: str
    opd_number: str
    temperature: str = ""  # Celsius
    blood_pressure_systolic: str = ""
    blood_pressure_diastolic: str = ""
    heart_rate: str = ""  # BPM
    respiratory_rate: str = ""  # Per minute
    oxygen_saturation: str = ""  # Percentage
    weight: str = ""  # Kg
    height: str = ""  # cm
    bmi: str = ""
    glucose_level: str = ""  # mg/dL
    notes: str = ""
    recorded_by: str = ""  # Nurse/Staff name
    recorded_at: datetime = Field(default_factory=datetime.utcnow)
    
class VitalSignsCreate(BaseModel):
    patient_id: str
    patient_name: str
    age: str
    opd_number: str
    temperature: str = ""
    blood_pressure_systolic: str = ""
    blood_pressure_diastolic: str = ""
    heart_rate: str = ""
    respiratory_rate: str = ""
    oxygen_saturation: str = ""
    weight: str = ""
    height: str = ""
    glucose_level: str = ""
    notes: str = ""
    recorded_by: str = ""

# Laboratory Models
class LabTest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    test_name: str
    test_code: str
    category: str = ""
    sample_type: str = ""
    normal_range: str = ""
    unit: str = ""
    price: float = 0.0
    tat_hours: int = 24  # Turnaround time in hours
    preparation_notes: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

class LabOrder(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    doctor_id: str = ""
    tests: List[str] = []  # List of test IDs
    priority: str = "routine"  # routine, urgent, stat
    clinical_notes: str = ""
    sample_collected_at: Optional[datetime] = None
    reported_at: Optional[datetime] = None
    status: TestStatus = TestStatus.PENDING
    total_amount: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class LabResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str
    test_id: str
    patient_id: str
    result_value: str = ""
    result_unit: str = ""
    reference_range: str = ""
    flag: str = ""  # normal, high, low, critical
    comments: str = ""
    validated_by: str = ""
    validated_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Pharmacy Models
class Medication(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    generic_name: str = ""
    strength: str = ""
    form: str = ""  # tablet, syrup, injection, etc.
    manufacturer: str = ""
    batch_number: str = ""
    expiry_date: str = ""
    mrp: float = 0.0
    selling_price: float = 0.0
    stock_quantity: int = 0
    min_stock_level: int = 10
    category: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Prescription(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    doctor_id: str
    medications: List[dict] = []  # List of {medication_id, dosage, frequency, duration, instructions}
    diagnosis: str = ""
    notes: str = ""
    status: PrescriptionStatus = PrescriptionStatus.PENDING
    prescribed_date: datetime = Field(default_factory=datetime.utcnow)
    dispensed_date: Optional[datetime] = None
    total_amount: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Nursing Models
class VitalSigns(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    recorded_by: str  # nurse user ID
    temperature: str = ""
    blood_pressure: str = ""
    pulse_rate: str = ""
    respiratory_rate: str = ""
    oxygen_saturation: str = ""
    weight: str = ""
    height: str = ""
    bmi: str = ""
    pain_scale: str = ""
    notes: str = ""
    recorded_at: datetime = Field(default_factory=datetime.utcnow)

class NursingProcedure(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    performed_by: str  # nurse user ID
    procedure_name: str
    procedure_notes: str = ""
    materials_used: str = ""
    charges: float = 0.0
    performed_at: datetime = Field(default_factory=datetime.utcnow)

# EMR Models
class Consultation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    doctor_id: str
    chief_complaint: str = ""
    history_present_illness: str = ""
    physical_examination: str = ""
    diagnosis: str = ""
    treatment_plan: str = ""
    follow_up_instructions: str = ""
    next_visit_date: Optional[str] = None
    consultation_fee: float = 0.0
    consultation_date: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Billing Models
class Bill(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    bill_number: str = ""
    items: List[dict] = []  # List of {item_name, quantity, rate, amount}
    subtotal: float = 0.0
    discount: float = 0.0
    tax: float = 0.0
    total_amount: float = 0.0
    paid_amount: float = 0.0
    balance_amount: float = 0.0
    payment_method: str = ""
    payment_date: Optional[datetime] = None
    status: str = "pending"  # pending, paid, partial
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
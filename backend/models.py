from pydantic import BaseModel, Field, validator
from typing import Optional, List, Literal, Dict, Any
from datetime import datetime, date, time
from enum import Enum
import uuid

# Enums and Types
ScheduleSymbol = Literal["NONE", "H", "H1", "X", "G", "K", "N"]
UserRole = Literal["admin", "reception", "laboratory", "pharmacy", "nursing", "doctor", "pharmacist", "assistant"]
UserStatus = Literal["active", "inactive", "suspended"]
EncounterMode = Literal["brief", "detailed"]
Priority = Literal["routine", "urgent", "stat"]
ConsultStatus = Literal["new", "reception_review", "scheduled", "in_progress", "completed", "declined", "cancelled"]
Sex = Literal["male", "female", "other"]
VitalPosition = Literal["sitting", "standing", "lying"]
BPLimb = Literal["right_arm", "left_arm", "right_leg", "left_leg"]
AppointmentStatus = Literal["scheduled", "confirmed", "checked_in", "completed", "cancelled", "no_show"]
TestStatus = Literal["ordered", "collected", "in_progress", "reported", "verified"]
PrescriptionStatus = Literal["pending", "dispensed", "cancelled"]
PurchaseType = Literal["CASH", "CREDIT"]
SaleMode = Literal["OPD", "OP", "IP"]
TxnType = Literal["PURCHASE", "SALE", "RETURN_IN", "RETURN_OUT", "DISPOSAL", "ISSUE_INTERNAL"]
PackType = Literal["TAB", "ML", "GM", "UNIT"]
PricingMode = Literal["MRP_INC", "RATE_EX"]

# Core EHR Models (required by existing server.py)
class User(BaseModel):
    id: Optional[str] = None
    username: str
    password_hash: str = ""
    full_name: str
    role: UserRole
    department: str
    email: Optional[str] = None
    status: UserStatus = "active"
    last_login: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    role: UserRole
    department: str
    email: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_role: str
    user_name: str

class Patient(BaseModel):
    id: Optional[str] = None
    patient_name: str
    age: str
    dob: Optional[str] = None
    sex: str
    address: Optional[str] = None
    phone_number: str
    email: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    allergies: Optional[str] = None
    medical_history: Optional[str] = None
    assigned_doctor: Optional[str] = None
    visit_type: Optional[str] = None
    patient_rating: Optional[int] = None
    opd_number: Optional[str] = None
    token_number: Optional[str] = None
    status: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class Doctor(BaseModel):
    id: Optional[str] = None
    name: str
    department_id: Optional[str] = None
    specialty: str
    qualification: Optional[str] = None
    default_fee: str
    phone: Optional[str] = None
    room_number: Optional[str] = None
    status: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class DoctorCreate(BaseModel):
    name: str
    department_id: Optional[str] = None
    specialty: str
    qualification: Optional[str] = None
    default_fee: str
    phone: Optional[str] = None
    room_number: Optional[str] = None

class DoctorUpdate(BaseModel):
    name: Optional[str] = None
    department_id: Optional[str] = None
    specialty: Optional[str] = None
    qualification: Optional[str] = None
    default_fee: Optional[str] = None
    phone: Optional[str] = None
    room_number: Optional[str] = None

class Department(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    status: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class DepartmentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

class Appointment(BaseModel):
    id: Optional[str] = None
    patient_name: str
    phone_number: str
    age: int
    sex: str
    address: Optional[str] = None
    doctor_id: str
    appointment_date: str
    appointment_time: str
    appointment_type: str
    notes: Optional[str] = None
    status: AppointmentStatus = "scheduled"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class AppointmentCreate(BaseModel):
    patient_name: str
    phone_number: str
    age: int
    sex: str
    address: Optional[str] = None
    doctor_id: str
    appointment_date: str
    appointment_time: str
    appointment_type: str
    notes: Optional[str] = None

class AppointmentUpdate(BaseModel):
    patient_name: Optional[str] = None
    phone_number: Optional[str] = None
    age: Optional[int] = None
    sex: Optional[str] = None
    address: Optional[str] = None
    doctor_id: Optional[str] = None
    appointment_date: Optional[str] = None
    appointment_time: Optional[str] = None
    appointment_type: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[AppointmentStatus] = None

class LabTest(BaseModel):
    id: Optional[str] = None
    test_name: str
    test_code: str
    category: str
    sample_type: str
    price: float
    tat_hours: int
    preparation_notes: Optional[str] = None
    created_at: Optional[datetime] = None

class LabOrder(BaseModel):
    id: Optional[str] = None
    patient_id: str
    doctor_id: str
    tests: List[str]
    status: TestStatus = "ordered"
    total_amount: Optional[float] = None
    sample_collected_at: Optional[datetime] = None
    reported_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class LabResult(BaseModel):
    id: Optional[str] = None
    order_id: str
    test_id: str
    result_value: str
    reference_range: Optional[str] = None
    unit: Optional[str] = None
    status: str = "normal"
    validated_by: Optional[str] = None
    validated_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

class Medication(BaseModel):
    id: Optional[str] = None
    name: str
    generic_name: str
    strength: str
    form: str
    mrp: float
    selling_price: float
    stock_quantity: int
    category: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class Prescription(BaseModel):
    id: Optional[str] = None
    patient_id: str
    doctor_id: str
    medications: List[Dict[str, Any]]
    status: PrescriptionStatus = "pending"
    total_amount: Optional[float] = None
    prescribed_date: Optional[datetime] = None
    dispensed_date: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class VitalSigns(BaseModel):
    id: Optional[str] = None
    patient_id: str
    temperature: Optional[float] = None
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    heart_rate: Optional[int] = None
    respiratory_rate: Optional[int] = None
    oxygen_saturation: Optional[float] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    recorded_by: Optional[str] = None
    recorded_at: Optional[datetime] = None

class NursingProcedure(BaseModel):
    id: Optional[str] = None
    patient_id: str
    procedure_name: str
    description: Optional[str] = None
    performed_by: Optional[str] = None
    performed_at: Optional[datetime] = None

class Consultation(BaseModel):
    id: Optional[str] = None
    patient_id: str
    doctor_id: str
    chief_complaint: str
    history: Optional[str] = None
    examination: Optional[str] = None
    diagnosis: Optional[str] = None
    treatment_plan: Optional[str] = None
    consultation_date: Optional[datetime] = None
    created_at: Optional[datetime] = None

class Bill(BaseModel):
    id: Optional[str] = None
    bill_number: str
    patient_id: str
    items: List[Dict[str, Any]]
    subtotal: float
    tax_amount: float
    discount_amount: float = 0.0
    total_amount: float
    payment_status: str = "pending"
    payment_method: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

# Pharmacy Models
class Supplier(BaseModel):
    id: Optional[str] = None
    name: str
    gstin: Optional[str] = None
    state: str = "Kerala"
    address: Optional[str] = None
    phones: List[str] = []
    email: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class Product(BaseModel):
    id: Optional[str] = None
    brand_name: str
    chemical_name: str
    strength: str
    form: str  # "Tablet", "Syrup", "Capsule", etc.
    hsn: str
    pack_type: PackType
    pack_size: int
    company_name: Optional[str] = None
    rack_id: Optional[str] = None
    min_level: Optional[int] = None
    max_level: Optional[int] = None
    schedule_symbol: ScheduleSymbol = "NONE"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class ProductCreate(BaseModel):
    brand_name: str
    chemical_name: str
    strength: str
    form: str
    hsn: str
    pack_type: PackType
    pack_size: int
    company_name: Optional[str] = None
    rack_id: Optional[str] = None
    min_level: Optional[int] = None
    max_level: Optional[int] = None
    schedule_symbol: ScheduleSymbol = "NONE"

class ChemicalSchedule(BaseModel):
    id: Optional[str] = None
    chemical_name_norm: str
    schedule_symbol: ScheduleSymbol
    source: Literal["ADMIN", "DERIVED"] = "DERIVED"
    updated_at: Optional[datetime] = None

class Batch(BaseModel):
    id: Optional[str] = None
    product_id: str
    batch_no: str
    expiry: str  # "YYYY-MM" format
    gst_rate: int
    mrp: float
    trade_price_ex_tax: float
    scheme_pct: float = 0.0
    cash_pct: float = 0.0
    received_qty: int
    free_qty: int = 0
    effective_cost_per_unit: float = 0.0
    supplier_id: str
    received_at: Optional[datetime] = None
    rack_id: Optional[str] = None
    status: Literal["PENDING", "APPROVED"] = "PENDING"

class BatchCreate(BaseModel):
    product_id: str
    batch_no: str
    expiry: str  # "YYYY-MM"
    gst_rate: int
    mrp: float
    trade_price_ex_tax: float
    scheme_pct: float = 0.0
    cash_pct: float = 0.0
    billed_qty: int
    free_qty: int = 0
    supplier_id: str
    rack_id: Optional[str] = None

class PurchaseItem(BaseModel):
    product_id: str
    batch_id: Optional[str] = None
    billed_qty: int
    free_qty: int = 0
    gst_rate: int
    scheme_pct: float = 0.0
    cash_pct: float = 0.0
    mrp: float
    trade_price_ex_tax: float
    hsn: str
    rack_id: Optional[str] = None
    schedule_symbol: ScheduleSymbol = "NONE"
    # Computed fields added during processing
    taxable: Optional[float] = None
    cgst: Optional[float] = None
    sgst: Optional[float] = None
    igst: Optional[float] = None
    row_net: Optional[float] = None

class PurchaseTotals(BaseModel):
    taxable: float = 0.0
    cgst: float = 0.0
    sgst: float = 0.0
    igst: float = 0.0
    cess: float = 0.0
    post_tax_discount: float = 0.0
    net_payable: float = 0.0

class Purchase(BaseModel):
    id: Optional[str] = None
    invoice_no: str
    invoice_date: str  # "YYYY-MM-DD"
    supplier_id: str
    type: PurchaseType
    items: List[PurchaseItem]
    totals: PurchaseTotals
    created_by: str
    approved_by: Optional[str] = None
    status: Literal["PENDING", "APPROVED", "REJECTED"] = "PENDING"
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class PurchaseCreate(BaseModel):
    invoice_no: str
    invoice_date: str
    supplier_id: str
    type: PurchaseType
    items: List[BatchCreate]

class StockLedger(BaseModel):
    id: Optional[str] = None
    product_id: str
    batch_id: str
    txn_type: TxnType
    qty_in: int = 0
    qty_out: int = 0
    cost_per_unit: Optional[float] = None
    mrp: Optional[float] = None
    ref_type: str
    ref_id: str
    created_at: Optional[datetime] = None

class Patient(BaseModel):
    name: str
    age: int
    sex: Literal["Male", "Female", "Other"]
    phone: Optional[str] = None

class SaleCompliance(BaseModel):
    required: bool = False
    schedule_symbol: Optional[ScheduleSymbol] = None
    rx_docs: List[str] = []  # file IDs or URLs
    rx_number: Optional[str] = None
    prescriber_reg_no: Optional[str] = None
    patient_id_proof: Optional[str] = None
    override_by: Optional[str] = None
    override_reason: Optional[str] = None

class SaleItem(BaseModel):
    id: Optional[str] = None
    sale_id: Optional[str] = None
    product_id: str
    batch_id: str
    nos: int
    pricing_mode: PricingMode = "MRP_INC"
    rate_ex_tax: Optional[float] = None
    mrp: float
    mrp_discount_pct: float = 0.0
    gst_rate: int
    schedule_symbol: ScheduleSymbol = "NONE"
    base_ex_tax: float = 0.0
    cgst: float = 0.0
    sgst: float = 0.0
    igst: float = 0.0
    net: float = 0.0
    prescribed_by: Optional[str] = None

class SaleItemCreate(BaseModel):
    product_id: str
    batch_id: str
    nos: int
    pricing_mode: PricingMode = "MRP_INC"
    rate_ex_tax: Optional[float] = None
    mrp: float
    mrp_discount_pct: float = 0.0
    gst_rate: int
    schedule_symbol: ScheduleSymbol = "NONE"

class Payment(BaseModel):
    id: Optional[str] = None
    sale_id: str
    split: Dict[str, float]  # {"cash": 100, "upi": 200}
    amount: float
    received_at: Optional[datetime] = None

class SaleTotals(BaseModel):
    mrp_total: float = 0.0
    discount_on_mrp: float = 0.0
    taxable: float = 0.0
    cgst: float = 0.0
    sgst: float = 0.0
    igst: float = 0.0
    net: float = 0.0

class Sale(BaseModel):
    id: Optional[str] = None
    bill_no: str
    date_time: datetime
    mode: SaleMode
    doctor_name: Optional[str] = None
    opd_no: Optional[str] = None
    patient: Patient
    items: List[str] = []  # sale_item_ids
    payments: List[str] = []  # payment_ids
    schedule_compliance: Optional[SaleCompliance] = None
    totals: SaleTotals
    time_to_serve_seconds: Optional[int] = None
    created_by: str
    edited_by: Optional[str] = None
    edited_at: Optional[datetime] = None
    edit_notes: Optional[str] = None
    created_at: Optional[datetime] = None

class SaleCreate(BaseModel):
    bill_no: str
    date_time: str  # ISO string
    mode: SaleMode
    doctor_name: Optional[str] = None
    opd_no: Optional[str] = None
    patient: Patient
    items: List[SaleItemCreate]
    payments: Dict[str, float]  # {"cash": 100, "upi": 200}
    time_to_serve_seconds: Optional[int] = None
    compliance: Optional[SaleCompliance] = None

class ReturnItem(BaseModel):
    sale_item_id: str
    batch_id: str
    qty_returned: int
    base_reversed: float = 0.0
    cgst_rev: float = 0.0
    sgst_rev: float = 0.0
    igst_rev: float = 0.0
    net_refund: float = 0.0

class ReturnTotals(BaseModel):
    base_reversed: float = 0.0
    cgst_rev: float = 0.0
    sgst_rev: float = 0.0
    igst_rev: float = 0.0
    net_refund: float = 0.0

class Return(BaseModel):
    id: Optional[str] = None
    sale_id: str
    bill_no: str
    date_time: datetime
    items: List[ReturnItem]
    totals: ReturnTotals
    schedule_link: Optional[Dict[str, Any]] = None
    created_by: str
    approved_by: Optional[str] = None
    created_at: Optional[datetime] = None

class ReturnCreate(BaseModel):
    sale_id: str
    bill_no: str
    items: List[Dict[str, Any]]  # {sale_item_id, batch_id, qty_returned}
    reason: Optional[str] = None

class Rack(BaseModel):
    id: Optional[str] = None
    name: str
    location_note: Optional[str] = None
    created_at: Optional[datetime] = None

class RackCreate(BaseModel):
    name: str
    location_note: Optional[str] = None

class Disposal(BaseModel):
    id: Optional[str] = None
    batch_id: str
    qty: int
    reason: Literal["expiry", "damage", "recall"]
    remark: str
    itc_reversal_tax: float = 0.0
    approved_by: str
    created_at: Optional[datetime] = None

class DisposalCreate(BaseModel):
    batch_id: str
    qty: int
    reason: Literal["expiry", "damage", "recall"]
    remark: str
    itc_reversal_tax: float = 0.0

class Audit(BaseModel):
    id: Optional[str] = None
    actor_id: str
    role: str
    action: str
    entity: str
    entity_id: str
    before: Optional[Dict[str, Any]] = None
    after: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None

# Settings Models
class SchedulePolicy(BaseModel):
    requires_rx: bool
    retention_days: int
    extra_fields: List[str] = []

class SchedulePolicies(BaseModel):
    H: SchedulePolicy = SchedulePolicy(requires_rx=True, retention_days=1825, extra_fields=["rx_number", "prescriber_reg_no"])
    H1: SchedulePolicy = SchedulePolicy(requires_rx=True, retention_days=1825, extra_fields=["rx_number", "prescriber_reg_no"])
    X: SchedulePolicy = SchedulePolicy(requires_rx=True, retention_days=1825, extra_fields=["rx_number", "prescriber_reg_no", "patient_id_proof"])
    G: SchedulePolicy = SchedulePolicy(requires_rx=False, retention_days=0, extra_fields=[])
    K: SchedulePolicy = SchedulePolicy(requires_rx=False, retention_days=0, extra_fields=[])
    N: SchedulePolicy = SchedulePolicy(requires_rx=True, retention_days=1825, extra_fields=["rx_number", "prescriber_reg_no"])
    NONE: SchedulePolicy = SchedulePolicy(requires_rx=False, retention_days=0, extra_fields=[])

class PharmacySettings(BaseModel):
    schedule_policies: SchedulePolicies = SchedulePolicies()
    kerala_gst_enabled: bool = True
    financial_year_start_month: int = 4  # April
    bill_number_format: str = "NNNN/FY{start_year}-{end_year}"

# Response Models
class ProductResponse(Product):
    current_stock: int = 0
    near_expiry_batches: int = 0

class BatchResponse(Batch):
    product_name: str = ""
    expiry_color: Literal["red", "orange", "yellow", "ok"] = "ok"
    current_stock: int = 0

class PurchaseResponse(Purchase):
    supplier_name: str = ""
    total_items: int = 0

class SaleResponse(Sale):
    total_items: int = 0
    payment_mode: str = ""
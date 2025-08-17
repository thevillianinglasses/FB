from pydantic import BaseModel, Field, validator
from typing import Optional, List, Literal, Dict, Any
from datetime import datetime
from enum import Enum

# Enums and Types
ScheduleSymbol = Literal["NONE", "H", "H1", "X", "G", "K", "N"]
UserRole = Literal["admin", "reception", "laboratory", "pharmacy", "nursing", "doctor", "pharmacist", "assistant"]
UserStatus = Literal["active", "inactive", "suspended"]
AppointmentStatus = Literal["scheduled", "confirmed", "checked_in", "completed", "cancelled", "no_show"]
TestStatus = Literal["ordered", "collected", "in_progress", "reported", "verified"]
PrescriptionStatus = Literal["pending", "dispensed", "cancelled"]
PurchaseType = Literal["CASH", "CREDIT"]
SaleMode = Literal["OPD", "OP", "IP"]
TxnType = Literal["PURCHASE", "SALE", "RETURN_IN", "RETURN_OUT", "DISPOSAL", "ISSUE_INTERNAL"]
PackType = Literal["TAB", "ML", "GM", "UNIT"]
PricingMode = Literal["MRP_INC", "RATE_EX"]

# Base Models
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
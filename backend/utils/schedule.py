# utils/schedule.py
from typing import Literal, Dict, List

ScheduleSymbol = Literal["NONE", "H", "H1", "X", "G", "K", "N"]

# Schedule priority levels (higher number = more restrictive)
SCHEDULE_PRIORITY = {
    "NONE": 0,
    "G": 1,      # General medicines
    "K": 1,      # Ayurvedic medicines  
    "H": 2,      # Schedule H
    "N": 2,      # Narcotic drugs
    "H1": 3,     # Schedule H1 (more restrictive than H)
    "X": 4       # Most restrictive
}

def is_more_restrictive(new_schedule: ScheduleSymbol, base_schedule: ScheduleSymbol) -> bool:
    """
    Check if new schedule is more restrictive than base schedule
    Used for chemical schedule escalation rules
    """
    return SCHEDULE_PRIORITY[new_schedule] >= SCHEDULE_PRIORITY[base_schedule]

def requires_prescription(schedule: ScheduleSymbol) -> bool:
    """Check if schedule requires prescription"""
    return schedule in {"H", "H1", "X", "N"}

def get_schedule_policy(schedule: ScheduleSymbol) -> Dict[str, any]:
    """Get policy settings for a schedule symbol"""
    policies = {
        "H": {
            "requires_rx": True,
            "retention_days": 1825,  # 5 years
            "extra_fields": ["rx_number", "prescriber_reg_no"],
            "description": "Schedule H - To be sold by retail on the prescription of a Registered Medical Practitioner only"
        },
        "H1": {
            "requires_rx": True,
            "retention_days": 1825,
            "extra_fields": ["rx_number", "prescriber_reg_no"],
            "description": "Schedule H1 - To be sold by retail on the prescription of a Registered Medical Practitioner only"
        },
        "X": {
            "requires_rx": True,
            "retention_days": 1825,
            "extra_fields": ["rx_number", "prescriber_reg_no", "patient_id_proof"],
            "description": "Schedule X - Narcotic and psychotropic substances - Requires special prescription and patient ID"
        },
        "N": {
            "requires_rx": True,
            "retention_days": 1825,
            "extra_fields": ["rx_number", "prescriber_reg_no"],
            "description": "Schedule N - Narcotic drugs - Requires prescription from authorized prescriber"
        },
        "G": {
            "requires_rx": False,
            "retention_days": 0,
            "extra_fields": [],
            "description": "Schedule G - General medicines - No prescription required"
        },
        "K": {
            "requires_rx": False,
            "retention_days": 0,
            "extra_fields": [],
            "description": "Schedule K - Ayurvedic medicines - No prescription required"
        },
        "NONE": {
            "requires_rx": False,
            "retention_days": 0,
            "extra_fields": [],
            "description": "No schedule classification"
        }
    }
    return policies.get(schedule, policies["NONE"])

def validate_schedule_compliance(schedule: ScheduleSymbol, compliance_data: Dict) -> List[str]:
    """
    Validate schedule compliance requirements
    Returns list of missing requirements
    """
    if schedule == "NONE":
        return []
    
    policy = get_schedule_policy(schedule)
    missing = []
    
    if policy["requires_rx"]:
        if not compliance_data.get("rx_docs"):
            missing.append("Prescription scan/document required")
        
        for field in policy["extra_fields"]:
            if not compliance_data.get(field):
                field_name = field.replace("_", " ").title()
                missing.append(f"{field_name} is required")
    
    return missing

def can_override_schedule(user_role: str, schedule: ScheduleSymbol) -> bool:
    """
    Check if user role can override schedule requirements
    Only Pharmacist-Incharge and Admin can override
    """
    if user_role in ["admin", "pharmacist"]:
        return True
    return False

def get_schedule_warning_text(schedule: ScheduleSymbol) -> str:
    """Get legal warning text for schedule on printed bills"""
    policy = get_schedule_policy(schedule)
    return policy["description"]

def normalize_chemical_name(chemical_name: str) -> str:
    """Normalize chemical name for consistent lookup"""
    return chemical_name.strip().lower()

def propagate_schedule_to_products(chemical_name: str, new_schedule: ScheduleSymbol) -> Dict[str, any]:
    """
    Generate update query to propagate schedule to all products with same chemical
    Only allows escalation to more restrictive schedules
    """
    # This returns the MongoDB aggregation pipeline for conditional updates
    return {
        "$set": {
            "schedule_symbol": {
                "$cond": [
                    # If new schedule is more restrictive, update; otherwise keep existing
                    {"$gte": [
                        {"$indexOfArray": [["NONE", "G", "K", "H", "N", "H1", "X"], new_schedule]},
                        {"$indexOfArray": [["NONE", "G", "K", "H", "N", "H1", "X"], "$schedule_symbol"]}
                    ]},
                    new_schedule,
                    "$schedule_symbol"
                ]
            },
            "updated_at": "$$NOW"
        }
    }

def get_schedule_chip_color(schedule: ScheduleSymbol) -> str:
    """Get color class for schedule chip display"""
    colors = {
        "H": "bg-amber-600",
        "H1": "bg-red-600", 
        "X": "bg-rose-700",
        "N": "bg-orange-600",
        "G": "bg-sky-600",
        "K": "bg-emerald-600",
        "NONE": "bg-gray-400"
    }
    return colors.get(schedule, "bg-gray-400")

def audit_schedule_change(old_schedule: ScheduleSymbol, new_schedule: ScheduleSymbol, 
                         entity_type: str, entity_id: str, user_id: str, user_role: str) -> Dict:
    """Generate audit record for schedule changes"""
    return {
        "actor_id": user_id,
        "role": user_role,
        "action": "SCHEDULE_CHANGE",
        "entity": entity_type,
        "entity_id": entity_id,
        "before": {"schedule_symbol": old_schedule},
        "after": {"schedule_symbol": new_schedule},
        "notes": f"Schedule changed from {old_schedule} to {new_schedule}"
    }

def validate_schedule_downgrade(current_schedule: ScheduleSymbol, new_schedule: ScheduleSymbol) -> bool:
    """
    Validate if schedule downgrade is allowed (generally not permitted)
    Returns True if change is valid, False if invalid downgrade
    """
    return is_more_restrictive(new_schedule, current_schedule)
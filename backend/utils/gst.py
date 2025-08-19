# utils/gst.py
from typing import Tuple, Dict

def split_tax_intra_inter(is_intra: bool, gst_rate: float, taxable: float) -> Tuple[float, float, float]:
    """
    Split GST based on intra-state (Kerala) or inter-state rules
    Returns: (cgst, sgst, igst)
    """
    if gst_rate == 0 or taxable == 0:
        return 0.0, 0.0, 0.0
    
    if is_intra:
        # Intra-state: split equally between CGST and SGST
        half_rate = (gst_rate / 2.0) / 100.0
        cgst = round(taxable * half_rate, 2)
        sgst = round(taxable * half_rate, 2)
        return cgst, sgst, 0.0
    else:
        # Inter-state: only IGST
        igst = round(taxable * (gst_rate / 100.0), 2)
        return 0.0, 0.0, igst

def calc_purchase_line(is_intra: bool, billed_qty: int, free_qty: int,
                       trade_price_ex: float, gst_rate: float,
                       scheme_pct: float = 0.0, cash_pct: float = 0.0) -> Dict[str, float]:
    """
    Calculate purchase line totals with Kerala GST compliance
    """
    # Scheme discount is pre-tax (reduces taxable value)
    scheme_amt = (trade_price_ex * billed_qty) * (scheme_pct / 100.0)
    taxable = max(0.0, (trade_price_ex * billed_qty) - scheme_amt)
    
    # Calculate GST
    cgst, sgst, igst = split_tax_intra_inter(is_intra, gst_rate, taxable)
    
    # Cash discount is post-tax by default (doesn't reduce GST base)
    post_tax_discount = (taxable + cgst + sgst + igst) * (cash_pct / 100.0)
    row_net = taxable + cgst + sgst + igst - post_tax_discount
    
    # Calculate effective cost per unit including free goods
    effective_qty = billed_qty + free_qty
    effective_cost_per_unit = row_net / max(1, effective_qty)
    
    return {
        "taxable": round(taxable, 2),
        "cgst": cgst,
        "sgst": sgst,
        "igst": igst,
        "post_tax_discount": round(post_tax_discount, 2),
        "row_net": round(row_net, 2),
        "effective_cost_per_unit": round(effective_cost_per_unit, 4),
        "effective_qty": effective_qty,
        "scheme_amount": round(scheme_amt, 2)
    }

def calc_sale_mrp_inclusive(is_intra: bool, qty: int, mrp: float, 
                           mrp_discount_pct: float, gst_rate: float) -> Dict[str, float]:
    """
    Calculate sale line for MRP-inclusive pricing (default retail)
    Patient pays MRP less discount; GST is back-calculated
    """
    selling_price_per_unit = mrp * (1 - (mrp_discount_pct / 100.0))
    line_total = selling_price_per_unit * qty
    
    # Back-calculate base amount (excluding GST)
    base_ex_tax = line_total / (1 + (gst_rate / 100.0)) if gst_rate > 0 else line_total
    tax_total = line_total - base_ex_tax
    
    # Split tax based on intra/inter state
    if is_intra and tax_total > 0:
        cgst = round(tax_total / 2.0, 2)
        sgst = round(tax_total / 2.0, 2)
        igst = 0.0
    elif not is_intra and tax_total > 0:
        cgst = 0.0
        sgst = 0.0
        igst = round(tax_total, 2)
    else:
        cgst = sgst = igst = 0.0
    
    return {
        "base_ex_tax": round(base_ex_tax, 2),
        "cgst": cgst,
        "sgst": sgst,
        "igst": igst,
        "net": round(line_total, 2),
        "discount_amount": round(mrp * qty * (mrp_discount_pct / 100.0), 2)
    }

def calc_sale_rate_exclusive(is_intra: bool, qty: int, rate_ex_tax: float, 
                            gst_rate: float) -> Dict[str, float]:
    """
    Calculate sale line for rate-exclusive pricing
    Base amount is given, GST is added on top
    """
    base_ex_tax = rate_ex_tax * qty
    cgst, sgst, igst = split_tax_intra_inter(is_intra, gst_rate, base_ex_tax)
    net = base_ex_tax + cgst + sgst + igst
    
    return {
        "base_ex_tax": round(base_ex_tax, 2),
        "cgst": cgst,
        "sgst": sgst,
        "igst": igst,
        "net": round(net, 2)
    }

def validate_gst_rate(gst_rate: int) -> bool:
    """Validate GST rate is one of the standard rates"""
    return gst_rate in [0, 5, 12, 18, 28]

def is_supplier_intra_kerala(supplier_state: str) -> bool:
    """Check if supplier is within Kerala (intra-state)"""
    return supplier_state.lower().strip() == "kerala"

def calc_itc_reversal(batch_cost: float, purchase_cgst: float, purchase_sgst: float, 
                     purchase_igst: float, disposed_qty: int, total_qty: int) -> float:
    """
    Calculate ITC reversal for disposed stock
    Proportionate input tax credit must be reversed
    """
    if total_qty <= 0:
        return 0.0
    
    proportion = disposed_qty / total_qty
    total_input_tax = purchase_cgst + purchase_sgst + purchase_igst
    itc_reversal = total_input_tax * proportion
    
    return round(itc_reversal, 2)

def generate_bill_number(financial_year_start: int = 4) -> str:
    """
    Generate bill number in format NNNN/FY25-26
    Resets every financial year (April-March)
    """
    from datetime import datetime
    
    now = datetime.now()
    current_year = now.year
    current_month = now.month
    
    # Determine financial year
    if current_month >= financial_year_start:
        # Current FY: Apr 2025 - Mar 2026 = FY25-26
        start_year = current_year
        end_year = current_year + 1
    else:
        # Previous FY: Apr 2024 - Mar 2025 = FY24-25
        start_year = current_year - 1
        end_year = current_year
    
    fy_code = f"FY{str(start_year)[-2:]}-{str(end_year)[-2:]}"
    
    # In real implementation, get next sequence number from database
    # For now, return placeholder
    return f"0001/{fy_code}"

def validate_expiry_date(expiry_str: str) -> bool:
    """
    Validate expiry date in YYYY-MM format
    Must be future date
    """
    try:
        from datetime import datetime
        expiry_date = datetime.strptime(expiry_str, "%Y-%m")
        return expiry_date > datetime.now()
    except ValueError:
        return False

def get_expiry_color(expiry_str: str) -> str:
    """
    Get color code for expiry date
    Red: ≤3 months, Orange: 3-6 months, Yellow: 6-12 months, OK: >12 months
    """
    try:
        from datetime import datetime
        from dateutil.relativedelta import relativedelta
        
        expiry_date = datetime.strptime(expiry_str, "%Y-%m")
        today = datetime.now()
        
        if expiry_date <= today + relativedelta(months=3):
            return "red"
        elif expiry_date <= today + relativedelta(months=6):
            return "orange"
        elif expiry_date <= today + relativedelta(months=12):
            return "yellow"
        else:
            return "ok"
    except:
        return "ok"
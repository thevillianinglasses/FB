// src/utils/gst.js
export function splitTax(isIntra, gstRate, taxable) {
  if (!gstRate || !taxable) return { cgst: 0, sgst: 0, igst: 0 };
  
  if (isIntra) {
    const half = (gstRate / 2) / 100;
    return {
      cgst: +(taxable * half).toFixed(2),
      sgst: +(taxable * half).toFixed(2),
      igst: 0
    };
  }
  
  return {
    cgst: 0,
    sgst: 0,
    igst: +(taxable * (gstRate / 100)).toFixed(2)
  };
}

export function calcPurchaseLine({ isIntra, billedQty, freeQty, tradePriceEx, gstRate, schemePct = 0, cashPct = 0 }) {
  const schemeAmt = tradePriceEx * billedQty * (schemePct / 100);
  const taxable = Math.max(0, tradePriceEx * billedQty - schemeAmt);
  const { cgst, sgst, igst } = splitTax(isIntra, gstRate, taxable);
  const postTaxDisc = (taxable + cgst + sgst + igst) * (cashPct / 100);
  const rowNet = taxable + cgst + sgst + igst - postTaxDisc;
  const effQty = billedQty + (freeQty || 0);
  const effCost = rowNet / Math.max(1, effQty);
  
  return {
    taxable: +taxable.toFixed(2),
    cgst,
    sgst,
    igst,
    postTaxDiscount: +postTaxDisc.toFixed(2),
    rowNet: +rowNet.toFixed(2),
    effectiveCostPerUnit: +effCost.toFixed(4),
    effectiveQty: effQty
  };
}

export function calcSaleMrpInc({ isIntra, qty, mrp, mrpDiscPct = 0, gstRate }) {
  const price = mrp * (1 - mrpDiscPct / 100);
  const lineTotal = price * qty;
  const base = gstRate ? (lineTotal / (1 + gstRate / 100)) : lineTotal;
  const tax = lineTotal - base;
  const cgst = isIntra ? tax / 2 : 0;
  const sgst = isIntra ? tax / 2 : 0;
  const igst = isIntra ? 0 : tax;
  
  return {
    baseExTax: +base.toFixed(2),
    cgst: +cgst.toFixed(2),
    sgst: +sgst.toFixed(2),
    igst: +igst.toFixed(2),
    net: +lineTotal.toFixed(2),
    discountAmount: +(mrp * qty * (mrpDiscPct / 100)).toFixed(2)
  };
}

export function calcSaleRateEx({ isIntra, qty, rateExTax, gstRate }) {
  const base = rateExTax * qty;
  const { cgst, sgst, igst } = splitTax(isIntra, gstRate, base);
  return {
    baseExTax: +base.toFixed(2),
    cgst,
    sgst,
    igst,
    net: +(base + cgst + sgst + igst).toFixed(2)
  };
}

export function validateGSTRate(gstRate) {
  return [0, 5, 12, 18, 28].includes(parseInt(gstRate));
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
}

export function generateBillNumber() {
  // Simple implementation - in real app, get from server
  const now = new Date();
  const fy = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const fyCode = `FY${String(fy).slice(-2)}-${String(fy + 1).slice(-2)}`;
  const billNum = Math.floor(Math.random() * 9999) + 1;
  return `${String(billNum).padStart(4, '0')}/${fyCode}`;
}
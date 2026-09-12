// ============================================================================
// B2B INDIA — RAZORPAY UNIFIED PAYMENT & ESCROW FEE CALCULATIONS
// ============================================================================
// Platform uses unified Razorpay Checkout supporting:
// 1. Razorpay UPI (Google Pay, PhonePe, Paytm, BHIM, CRED, QR inside Razorpay)
// 2. NetBanking, Corporate Credit/Debit Cards, EMI
//
// Special Booking Price Rules:
// - Total Order Value >= ₹10,00,000 (10 Lakhs):
//     Base Escrow Advance: ₹97,640
//     Razorpay UPI Platform Fee: ₹2,360 (Flat ₹2,000 + 18% GST) -> Total UPI Payable = Flat ₹1,00,000
//     Razorpay Cards/NetBanking Fee: 2.5% + 18% GST (₹2,880) -> Total Cards Payable = ₹1,00,520
// - Total Order Value < ₹10,00,000 (10 Lakhs):
//     Base Escrow Advance: 10% of Total Order Value
//     Razorpay UPI Fee: 2% + 18% GST (2.36% total)
//     Razorpay Cards/NetBanking Fee: 2.5% + 18% GST (2.95% total)
// ============================================================================

/**
 * Calculates base advance escrow deposit based on total contract value.
 */
export function calculateAdvanceAmount(totalContractValue, settings = null) {
  const total = Number(totalContractValue) || 0;
  const threshold = Number(settings?.high_value_threshold?.value ?? settings?.high_value_threshold ?? 1000000);
  const highValueBase = Number(settings?.high_value_advance_base?.value ?? settings?.high_value_advance_base ?? 97640);
  const standardPercent = Number(settings?.standard_advance_percent?.value ?? settings?.standard_advance_percent ?? 10);

  if (total >= threshold) {
    return highValueBase;
  }
  return Math.round(total * (standardPercent / 100));
}

/**
 * Calculates complete fee breakdown for Razorpay UPI and Razorpay Cards/NetBanking.
 */
export function calculatePaymentBreakdown(totalContractValue, settings = null) {
  const total = Number(totalContractValue) || 0;
  const threshold = Number(settings?.high_value_threshold?.value ?? settings?.high_value_threshold ?? 1000000);
  const highValueBase = Number(settings?.high_value_advance_base?.value ?? settings?.high_value_advance_base ?? 97640);
  const highValueUpiFee = Number(settings?.high_value_upi_fee?.value ?? settings?.high_value_upi_fee ?? 2360);
  const cardRatePercent = Number(settings?.cards_surcharge_rate_percent?.value ?? settings?.cards_surcharge_rate_percent ?? 2.5);
  const standardPercent = Number(settings?.standard_advance_percent?.value ?? settings?.standard_advance_percent ?? 10);
  const gstPercent = Number(settings?.default_gst_percent?.value ?? settings?.default_gst_percent ?? 18);

  const isHighValue = total >= threshold;

  if (isHighValue) {
    const baseAdvance = highValueBase;
    
    // UPI: Fixed fee (e.g. ₹2,360) -> ₹1,00,000 Total
    const upiTotalFee = highValueUpiFee;
    const upiPlatformFee = Math.round((upiTotalFee / (1 + gstPercent / 100)) * 100) / 100;
    const upiGst = Math.round((upiTotalFee - upiPlatformFee) * 100) / 100;
    const upiTotalPayable = baseAdvance + upiTotalFee;

    // Cards / Netbanking: e.g. 2.5% + GST on baseAdvance
    const cardFeeBase = Math.round(baseAdvance * (cardRatePercent / 100) * 100) / 100;
    const cardGst = Math.round(cardFeeBase * (gstPercent / 100) * 100) / 100;
    const cardTotalFee = Math.round((cardFeeBase + cardGst) * 100) / 100;
    const cardTotalPayable = Math.round(baseAdvance + cardTotalFee);

    return {
      isHighValue: true,
      baseAdvance,
      remainingBalance: Math.max(0, total - baseAdvance),
      upi: {
        methodName: 'Razorpay UPI (GPay, PhonePe, Paytm, BHIM)',
        baseAdvance,
        platformFee: upiPlatformFee,
        gstOnFee: upiGst,
        totalFee: upiTotalFee,
        totalPayable: upiTotalPayable,
        feeLabel: '₹2,360 (₹2,000 + 18% GST)',
      },
      cards: {
        methodName: 'Razorpay Cards, NetBanking & Corporate Credit',
        baseAdvance,
        gatewayFee: cardFeeBase,
        gstOnFee: cardGst,
        totalFee: cardTotalFee,
        totalPayable: cardTotalPayable,
        feeLabel: '2.5% + 18% GST (₹' + cardTotalFee.toLocaleString('en-IN') + ')',
      },
      razorpay: {
        totalPayable: upiTotalPayable, // Default to UPI total
        gatewayFee: upiPlatformFee,
        gstOnFee: upiGst,
        totalFee: upiTotalFee,
      }
    };
  }

  // Standard Advance & Razorpay Fee Calculation (2.5% + 18% GST for all transactions)
  const baseAdvance = isHighValue ? highValueBase : Math.round(total * 0.10);
  const feeRatePercent = 2.5; // 2.5% for all transactions
  const gstRatePercent = 18;  // 18% GST

  const gatewayFeeBase = Math.round(baseAdvance * (feeRatePercent / 100) * 100) / 100;
  const gstOnFee = Math.round(gatewayFeeBase * (gstRatePercent / 100) * 100) / 100;
  const totalFee = Math.round((gatewayFeeBase + gstOnFee) * 100) / 100;
  const totalPayable = Math.round(baseAdvance + totalFee);

  return {
    isHighValue,
    baseAdvance,
    remainingBalance: Math.max(0, total - baseAdvance),
    upi: {
      methodName: 'Razorpay UPI (GPay, PhonePe, Paytm, BHIM)',
      baseAdvance,
      platformFee: gatewayFeeBase,
      gstOnFee,
      totalFee,
      totalPayable,
      feeLabel: '2.5% + 18% GST (₹' + totalFee.toLocaleString('en-IN') + ')',
    },
    cards: {
      methodName: 'Razorpay Cards, NetBanking & Corporate Credit',
      baseAdvance,
      gatewayFee: gatewayFeeBase,
      gstOnFee,
      totalFee,
      totalPayable,
      feeLabel: '2.5% + 18% GST (₹' + totalFee.toLocaleString('en-IN') + ')',
    },
    razorpay: {
      totalPayable,
      gatewayFee: gatewayFeeBase,
      gstOnFee,
      totalFee,
    }
  };
}

// ============================================================================
// GST VERIFICATION API
// ============================================================================
// Validates Indian GST Number (GSTIN) with:
// 1. Format validation (15-char regex)
// 2. State code validation
// 3. Checksum digit verification (catches fake GSTINs)
// Future-ready: can plug in Cashfree/Surepass API for live business lookup.
// ============================================================================

import { NextResponse } from 'next/server';

// Indian state codes mapped from first 2 digits of GSTIN
const STATE_CODES = {
  '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
  '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana',
  '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
  '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
  '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram',
  '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam',
  '19': 'West Bengal', '20': 'Jharkhand', '21': 'Odisha',
  '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
  '26': 'Dadra & Nagar Haveli and Daman & Diu', '27': 'Maharashtra',
  '28': 'Andhra Pradesh (Old)', '29': 'Karnataka', '30': 'Goa',
  '31': 'Lakshadweep', '32': 'Kerala', '33': 'Tamil Nadu',
  '34': 'Puducherry', '35': 'Andaman & Nicobar Islands',
  '36': 'Telangana', '37': 'Andhra Pradesh', '38': 'Ladakh',
  '97': 'Other Territory',
};

// Entity type from 4th character (first char of PAN)
const ENTITY_TYPES = {
  'C': 'Company', 'P': 'Partnership Firm', 'H': 'HUF',
  'A': 'Association of Persons', 'B': 'Body of Individuals',
  'T': 'Trust', 'J': 'Artificial Juridical Person',
  'G': 'Government', 'L': 'Local Authority', 'F': 'Firm',
  'K': 'Others',
};

// Standard GSTIN regex: 2-digit state code + 10-char PAN + 1 entity digit + Z + 1 checksum
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// Character set for GSTIN checksum calculation
const GSTIN_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Validates GSTIN checksum using the official algorithm.
 * The 15th character is a check digit computed from the first 14 characters.
 *
 * Algorithm:
 * 1. Map each character to its index in GSTIN_CHARS (0-35)
 * 2. For each position: multiply by factor (1 for even, 2 for odd positions)
 * 3. Sum quotient and remainder when dividing product by 36
 * 4. Check digit = (36 - (totalSum % 36)) % 36
 * 5. Map back to character
 */
function validateGSTINChecksum(gstin) {
  let sum = 0;

  for (let i = 0; i < 14; i++) {
    const charValue = GSTIN_CHARS.indexOf(gstin.charAt(i));
    if (charValue === -1) return false;

    const factor = (i % 2 === 0) ? 1 : 2;
    const product = factor * charValue;
    const quotient = Math.floor(product / 36);
    const remainder = product % 36;
    sum += quotient + remainder;
  }

  const expectedCheckIndex = (36 - (sum % 36)) % 36;
  const expectedCheckChar = GSTIN_CHARS.charAt(expectedCheckIndex);
  const actualCheckChar = gstin.charAt(14);

  return expectedCheckChar === actualCheckChar;
}

export async function POST(request) {
  try {
    const { gstNumber } = await request.json();

    if (!gstNumber) {
      return NextResponse.json(
        { valid: false, error: 'GST number is required.' },
        { status: 400 }
      );
    }

    const gstin = gstNumber.toUpperCase().trim();

    // 1. Length check
    if (gstin.length !== 15) {
      return NextResponse.json({
        valid: false,
        error: `GST number must be exactly 15 characters. You entered ${gstin.length}.`,
      }, { status: 400 });
    }

    // 2. Format validation
    if (!GST_REGEX.test(gstin)) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid GST format. Expected: 2-digit state code + 5 letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 check digit.',
      }, { status: 400 });
    }

    // 3. State code validation
    const stateCode = gstin.substring(0, 2);
    const stateName = STATE_CODES[stateCode];
    if (!stateName) {
      return NextResponse.json({
        valid: false,
        error: `Invalid state code "${stateCode}". Not a valid Indian state/UT code.`,
      }, { status: 400 });
    }

    // 4. Checksum validation — catches fake/random GSTINs
    if (!validateGSTINChecksum(gstin)) {
      return NextResponse.json({
        valid: false,
        error: 'GST Number is invalid! The check digit does not match. Please enter a real, registered GST Number.',
      }, { status: 400 });
    }

    // Extract components
    const panNumber = gstin.substring(2, 12);
    const entityType = ENTITY_TYPES[gstin.charAt(3)] || 'Unknown';

    return NextResponse.json({
      valid: true,
      gstin,
      details: {
        stateCode,
        stateName,
        panNumber,
        entityType,
        registrationNumber: gstin.substring(12, 13),
        // These would come from a real API (Cashfree/Surepass):
        legalName: null,
        tradeName: null,
        registrationStatus: 'checksum_verified',
        registrationDate: null,
        principalAddress: null,
      },
      verificationMethod: 'checksum_validation',
      message: 'GST number is valid (format + checksum verified). Admin will confirm registration status.',
    });

  } catch (error) {
    console.error('GST verification error:', error);
    return NextResponse.json(
      { valid: false, error: 'Internal server error during verification.' },
      { status: 500 }
    );
  }
}

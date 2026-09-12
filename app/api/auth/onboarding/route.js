// ============================================================================
// ONBOARDING API
// ============================================================================
// Completes user registration after Google OAuth or email signup.
// Validates GST, auto-generates display ID (S01, B01...), saves profile,
// and logs the registration activity.
// ============================================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/services/supabaseServer';
import { createAdminClient } from '@/services/supabaseServer';

// GSTIN format regex
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// Checksum validation
const GSTIN_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function validateGSTINChecksum(gstin) {
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const charValue = GSTIN_CHARS.indexOf(gstin.charAt(i));
    if (charValue === -1) return false;
    const factor = (i % 2 === 0) ? 1 : 2;
    const product = factor * charValue;
    sum += Math.floor(product / 36) + (product % 36);
  }
  const expectedCheckChar = GSTIN_CHARS.charAt((36 - (sum % 36)) % 36);
  return expectedCheckChar === gstin.charAt(14);
}

/**
 * Generates the next sequential display ID for a given role.
 * Suppliers: S01, S02, S03...
 * Buyers: B01, B02, B03...
 */
async function generateDisplayId(supabaseAdmin, role) {
  // If role is 'both', we default to a supplier prefix 'S' since they default to supplier dashboard
  const prefix = role === 'supplier' || role === 'both' ? 'S' : role === 'admin' ? 'A' : 'B';

  // Query existing display IDs for this prefix
  const { data: existingUsers, error } = await supabaseAdmin
    .from('users')
    .select('display_id')
    .like('display_id', `${prefix}%`)
    .order('display_id', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error querying display IDs:', error);
  }

  let nextNum = 1;

  if (existingUsers && existingUsers.length > 0) {
    const lastId = existingUsers[0].display_id;
    const numPart = parseInt(lastId.substring(1), 10);
    if (!isNaN(numPart)) {
      nextNum = numPart + 1;
    }
  }

  // Zero-pad to at least 2 digits
  return `${prefix}${String(nextNum).padStart(2, '0')}`;
}

export async function POST(request) {
  try {
    const supabase = await createClient();

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated. Please log in first.' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      role = 'both',
      companyName,
      gstNumber,
      phone,
      categories = [],
      fullName,
    } = body;

    const userRole = role || 'both';

    // ── Validation ──
    if (!['buyer', 'supplier', 'both'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Please select a valid role (buyer, supplier, or both).' },
        { status: 400 }
      );
    }

    if (!companyName || companyName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Company name is required (minimum 2 characters).' },
        { status: 400 }
      );
    }

    if (!gstNumber) {
      return NextResponse.json(
        { error: 'GST number is required.' },
        { status: 400 }
      );
    }

    const gstin = gstNumber.toUpperCase().trim();
    if (!GST_REGEX.test(gstin) || !validateGSTINChecksum(gstin)) {
      return NextResponse.json(
        { error: 'Invalid GST number. The checksum does not match. Please enter a real, registered GSTIN.' },
        { status: 400 }
      );
    }

    if (!phone || phone.trim().length < 10) {
      return NextResponse.json(
        { error: 'A valid phone number is required.' },
        { status: 400 }
      );
    }

    if (!categories || categories.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one category.' },
        { status: 400 }
      );
    }

    // ── Use admin client for ID generation (bypasses RLS) ──
    const supabaseAdmin = createAdminClient();

    // Check if GST number already exists for OTHER users
    const { data: existingGst } = await supabaseAdmin
      .from('users')
      .select('id, display_id, company_name')
      .eq('gst_number', gstin)
      .neq('firebase_uid', user.id)
      .limit(1);

    if (existingGst && existingGst.length > 0) {
      return NextResponse.json(
        { error: 'This GST number is already registered with another account.' },
        { status: 409 }
      );
    }

    // Check if THIS user already has a display_id or profile
    const { data: currentUser } = await supabaseAdmin
      .from('users')
      .select('display_id, onboarding_complete')
      .eq('firebase_uid', user.id)
      .single();

    // ── Generate or reuse display ID ──
    const displayId = currentUser?.display_id || await generateDisplayId(supabaseAdmin, role);

    // ── Extract state from GST ──
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
    };
    const stateCode = gstin.substring(0, 2);
    const stateName = STATE_CODES[stateCode] || 'Unknown';

    // ── Upsert user profile ──
    const authProvider = user.app_metadata?.provider || user.app_metadata?.providers?.[0] || 'email';
    const profileData = {
      firebase_uid: user.id,
      display_id: displayId,
      company_name: companyName.trim(),
      full_name: fullName?.trim() || user.user_metadata?.full_name || '',
      registered_email: user.email,
      corporate_phone: phone.trim(),
      role: userRole,
      gst_number: gstin,
      gst_verified: false,
      gst_status: 'format_verified',
      categories: categories,
      state: stateName,
      city: 'Pending',
      pincode: '000000',
      warehouse_address: 'Pending',
      geo_lat: 0.0,
      geo_lng: 0.0,
      status: 'pending_verification',
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    };

    const { data: upsertedUser, error: profileError } = await supabaseAdmin
      .from('users')
      .upsert(profileData, { onConflict: 'firebase_uid' })
      .select('id, display_id')
      .single();

    if (profileError) {
      console.error('Profile upsert error:', profileError);
      return NextResponse.json(
        { error: 'Failed to save profile: ' + profileError.message },
        { status: 500 }
      );
    }

    // ── Log registration activity ──
    await supabaseAdmin
      .from('activity_logs')
      .insert({
        user_id: upsertedUser.id,
        action: 'registered',
        details: {
          display_id: displayId,
          role: userRole,
          company_name: companyName.trim(),
          gst_number: gstin,
          categories,
          registration_method: user.app_metadata?.provider || 'email',
        },
      });

    return NextResponse.json({
      success: true,
      displayId,
      role: userRole,
      companyName: companyName.trim(),
      message: `Registration successful! Your Trade Partner ID is ${displayId}.`,
    });

  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@/services/supabaseServer';

// GET — Returns full profile data for the authenticated user
export async function GET(request) {
  try {
    const supabase = await createClient();
    const { createAdminClient } = require('@/services/supabaseServer');
    const adminClient = createAdminClient();

    let user = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: tokenUser } = await adminClient.auth.getUser(token);
      if (tokenUser?.user) {
        user = tokenUser.user;
      }
    }

    if (!user) {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        user = authUser;
      } catch (e) {}
    }
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let { data: profile } = await adminClient
      .from('users')
      .select('*')
      .eq('firebase_uid', user.id)
      .maybeSingle();

    if (!profile) {
      const { data: byId } = await adminClient
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (byId) {
        profile = byId;
        await adminClient.from('users').update({ firebase_uid: user.id }).eq('id', profile.id);
      }
    }

    if (!profile && user.email) {
      const { data: byEmail } = await adminClient
        .from('users')
        .select('*')
        .ilike('registered_email', user.email)
        .maybeSingle();
      if (byEmail) {
        profile = byEmail;
        await adminClient.from('users').update({ firebase_uid: user.id }).eq('id', profile.id);
      }
    }

    if (!profile) {
      const newCompanyName = user.user_metadata?.company_name || user.user_metadata?.full_name || (user.email ? user.email.split('@')[0] : 'Verified Business');
      const insertUser = {
        firebase_uid: user.id,
        registered_email: user.email || `user_${user.id.slice(0, 8)}@b2bindia.site`,
        company_name: newCompanyName,
        corporate_phone: user.user_metadata?.phone || '+91 9999999999',
        role: 'buyer',
        status: 'active',
        gst_number: 'PENDING',
        warehouse_address: 'India Warehouse',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        geo_lat: 19.0760,
        geo_lng: 72.8777
      };
      const { data: createdProfile } = await adminClient
        .from('users')
        .insert([insertUser])
        .select()
        .single();
      if (createdProfile) {
        profile = createdProfile;
      }
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Compute profile completion percentage
    const fields = [
      'company_name', 'phone_number', 'gst_number', 'job_title', 'website',
      'about_us', 'total_employees', 'year_established', 'warehouse_address',
      'city', 'state', 'pincode', 'sourcing_frequency', 'annual_spending'
    ];
    const filled = fields.filter(f => profile[f] && String(profile[f]).trim() !== '').length;
    const completionPercent = Math.round((filled / fields.length) * 100);

    const { getUserMembership } = require('@/services/membershipStore');
    const membership = getUserMembership(user.id, user.email);
    profile.membership_plan = membership.plan || 'FREE TIER';
    profile.membership_expires_at = membership.expiresAt;
    profile.can_upload_products = membership.canUpload;

    return NextResponse.json({ 
      profile, 
      membership,
      completionPercent,
      email: user.email,
      authProvider: user.app_metadata?.providers?.includes('google') ? 'google' : 'email',
      yearJoined: new Date(user.created_at).getFullYear(),
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT — Updates profile fields (extended set)
export async function PUT(request) {
  try {
    const supabase = await createClient();
    const { createAdminClient } = require('@/services/supabaseServer');
    const adminClient = createAdminClient();

    let user = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: tokenUser } = await adminClient.auth.getUser(token);
      if (tokenUser?.user) {
        user = tokenUser.user;
      }
    }

    if (!user) {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        user = authUser;
      } catch (e) {}
    }
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Whitelist of allowed update fields
    const allowedFields = [
      'company_name', 'phone_number', 'gst_number', 'pan_number', 'job_title', 'website',
      'about_us', 'platforms_sold_on', 'total_employees', 'year_established',
      'warehouse_address', 'city', 'state', 'pincode', 'full_name', 'role',
      'sourcing_frequency', 'annual_spending', 'company_logo_url', 'categories',
      'whatsapp_number', 'corporate_phone', 'annual_turnover_lakhs', 'gst_legal_name',
      'gst_verified', 'gst_status'
    ];

    const updateData = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        // Convert empty strings to null for numeric compatibility
        updateData[key] = body[key] === '' ? null : body[key];
      }
    }

    // Handle numeric conversions
    if (body.annual_turnover_lakhs !== undefined) {
      updateData.annual_turnover_lakhs = body.annual_turnover_lakhs === '' || body.annual_turnover_lakhs === null 
        ? null 
        : Number(body.annual_turnover_lakhs);
    }
    if (body.year_established !== undefined) {
      updateData.year_established = body.year_established === '' || body.year_established === null 
        ? null 
        : Number(body.year_established);
    }

    // Handle categories conversion (array or comma-separated string)
    if (body.categories !== undefined) {
      if (Array.isArray(body.categories)) {
        updateData.categories = body.categories;
      } else if (typeof body.categories === 'string' && body.categories.trim()) {
        updateData.categories = body.categories.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    // Incorporate village / custom_village into warehouse_address if provided
    const villageVal = body.custom_village || body.village;
    if (villageVal && villageVal !== 'Other' && villageVal !== '-- Select Village / Taluka --') {
      if (updateData.warehouse_address) {
        if (!updateData.warehouse_address.includes(villageVal)) {
          updateData.warehouse_address = `${updateData.warehouse_address}, ${villageVal}`;
        }
      } else {
        updateData.warehouse_address = villageVal;
      }
    }

    // Auto-verify GSTIN format
    if (updateData.gst_number) {
      const cleanGst = String(updateData.gst_number).trim().toUpperCase();
      updateData.gst_number = cleanGst;
      if (/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(cleanGst)) {
        updateData.gst_verified = true;
        updateData.gst_status = 'format_verified';
      }
    }

    // Auto-uppercase PAN
    if (updateData.pan_number) {
      updateData.pan_number = String(updateData.pan_number).trim().toUpperCase();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // 1. Locate the exact user record in database
    let existingUser = null;
    const { data: byUid } = await adminClient
      .from('users')
      .select('id, firebase_uid, registered_email')
      .eq('firebase_uid', user.id)
      .maybeSingle();

    if (byUid) {
      existingUser = byUid;
    } else {
      const { data: byId } = await adminClient
        .from('users')
        .select('id, firebase_uid, registered_email')
        .eq('id', user.id)
        .maybeSingle();
      if (byId) {
        existingUser = byId;
      } else if (user.email) {
        const { data: byEmail } = await adminClient
          .from('users')
          .select('id, firebase_uid, registered_email')
          .ilike('registered_email', user.email)
          .maybeSingle();
        if (byEmail) existingUser = byEmail;
      }
    }

    if (!existingUser) {
      return NextResponse.json({ error: 'User profile record not found in database' }, { status: 404 });
    }

    // Keep phone fields synchronized
    if (updateData.phone_number && !updateData.corporate_phone) {
      updateData.corporate_phone = updateData.phone_number;
    } else if (updateData.corporate_phone && !updateData.phone_number) {
      updateData.phone_number = updateData.corporate_phone;
    }

    updateData.firebase_uid = user.id;
    updateData.updated_at = new Date().toISOString();

    const { data: profile, error: updateError } = await adminClient
      .from('users')
      .update(updateData)
      .eq('id', existingUser.id)
      .select()
      .single();

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Sync metadata to Supabase Auth
    try {
      if (updateData.full_name || updateData.company_name || updateData.role) {
        await adminClient.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...(user.user_metadata || {}),
            full_name: updateData.full_name || updateData.company_name,
            company_name: updateData.company_name || user.user_metadata?.company_name,
            role: updateData.role || user.user_metadata?.role
          }
        });
      }
    } catch (authSyncErr) {
      console.warn('Notice: Auth user metadata sync skipped:', authSyncErr.message);
    }

    return NextResponse.json({ profile, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

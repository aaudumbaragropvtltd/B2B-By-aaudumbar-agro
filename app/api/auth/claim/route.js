// ============================================================================
// AUTH CLAIMS API ROUTE
// ============================================================================
// Updates user profile data in Supabase after registration.
// Protected: requires valid Supabase auth session.
// ============================================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/services/supabaseServer';

export async function POST(request) {
  try {
    const supabase = await createClient();

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { role, companyName, gstNumber, phone } = body;

    // Validate role
    const validRoles = ['buyer', 'supplier', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    // Only admins can set admin role
    if (role === 'admin') {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (existingProfile?.role !== 'admin') {
        return NextResponse.json(
          { error: 'Only existing admins can create admin accounts' },
          { status: 403 }
        );
      }
    }

    // Upsert user profile in Supabase
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        company_name: companyName || 'Unnamed Company',
        email: user.email,
        phone: phone || '',
        role: role,
        status: 'pending_verification',
        gst_number: gstNumber || 'PENDING',
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error('Profile upsert error:', profileError);
      return NextResponse.json(
        { error: 'Failed to update profile: ' + profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      uid: user.id,
      profile: { role, status: 'pending_verification' },
      message: 'Profile updated successfully.',
    });
  } catch (error) {
    console.error('Auth claims error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

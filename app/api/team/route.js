import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { get(name) { return cookieStore.get(name)?.value; } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get current user profile
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('id, parent_id, team_role')
      .eq('firebase_uid', user.id)
      .single();

    if (!profile) return new NextResponse('User not found', { status: 404 });

    // Determine the root organization ID
    const organizationId = profile.parent_id || profile.id;

    // Fetch all staff in this organization (the owner + all subaccounts)
    const { data: teamMembers, error } = await supabaseAdmin
      .from('users')
      .select('id, company_name, registered_email, corporate_phone, team_role, created_at')
      .or(`id.eq.${organizationId},parent_id.eq.${organizationId}`)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json(teamMembers);
  } catch (error) {
    console.error('Error fetching team:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { get(name) { return cookieStore.get(name)?.value; } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Verify current user is an Owner
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('id, team_role, company_name')
      .eq('firebase_uid', user.id)
      .single();

    if (!profile || profile.team_role !== 'owner') {
      return NextResponse.json({ error: 'Only Organization Owners can add team members.' }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, fullName, phone, role } = body;

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Create user in Supabase Auth using Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // Auto confirm for team members
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // 2. Insert into users table as a subaccount
    const { data: subaccount, error: dbError } = await supabaseAdmin
      .from('users')
      .insert([{
        firebase_uid: authData.user.id,
        parent_id: profile.id, // Link to organization root
        team_role: role,
        company_name: `${profile.company_name} (${fullName})`,
        registered_email: email,
        corporate_phone: phone || 'N/A',
        role: 'supplier', // Base system role
        status: 'active'
      }])
      .select()
      .single();

    if (dbError) {
      // Rollback auth user if db insert fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw dbError;
    }

    return NextResponse.json({ success: true, member: subaccount });
  } catch (error) {
    console.error('Error adding team member:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

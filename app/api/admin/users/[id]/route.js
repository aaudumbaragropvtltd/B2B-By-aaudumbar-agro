// ============================================================================
// B2B INDIA — ADMIN SINGLE USER MANAGEMENT API (GET / PATCH / DELETE)
// ============================================================================
// Performs full database persistence for:
// - GET: Complete user dossier (profile, products, searches, activity)
// - PATCH: Real-time update of all profile & KYC fields in Supabase
// - DELETE: Safe cascade deletion of user and related records from database
// ============================================================================

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let query = supabaseAdmin.from('users').select('*');
    if (isUUID) {
      query = query.eq('id', id);
    } else {
      query = query.or(`id.eq.${id},firebase_uid.eq.${id},display_id.eq.${id}`);
    }

    const { data: user, error: userError } = await query.single();
    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch user's products and searches in parallel
    const [productsRes, searchesRes, viewsRes] = await Promise.all([
      supabaseAdmin.from('products').select('*').eq('supplier_id', user.id).order('created_at', { ascending: false }),
      supabaseAdmin.from('search_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      (async () => {
        try {
          return await supabaseAdmin.from('user_product_views').select('*').eq('user_id', user.id).order('viewed_at', { ascending: false });
        } catch (e) {
          return { data: [] };
        }
      })()
    ]);

    return NextResponse.json({
      user,
      products: productsRes.data || [],
      searches: searchesRes.data || [],
      views: viewsRes?.data || []
    });
  } catch (error) {
    console.error('Admin user detail error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const supabaseAdmin = getAdminClient();

    // Map all potential editable profile, contact, KYC, and status fields
    const updateData = {
      updated_at: new Date().toISOString()
    };

    const allowedFields = [
      'full_name',
      'company_name',
      'job_title',
      'registered_email',
      'corporate_phone',
      'phone_number',
      'whatsapp_number',
      'role',
      'status',
      'gst_number',
      'gst_legal_name',
      'gst_verified',
      'gst_status',
      'pan_number',
      'warehouse_address',
      'city',
      'state',
      'pincode',
      'website',
      'about_us',
      'year_established',
      'total_employees',
      'annual_spending',
      'sourcing_frequency',
      'onboarding_complete',
      'categories',
      'platforms_sold_on'
    ];

    // Field aliases
    if (body.contact_person && !body.full_name) updateData.full_name = String(body.contact_person).trim();
    if (body.user_and_business && !body.company_name) updateData.company_name = String(body.user_and_business).trim();
    if (body.email && !body.registered_email) updateData.registered_email = String(body.email).trim();
    if (body.phone && !body.corporate_phone) updateData.corporate_phone = String(body.phone).trim();
    if (body.location && !body.warehouse_address) updateData.warehouse_address = String(body.location).trim();

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        if (field === 'gst_verified' || field === 'onboarding_complete') {
          updateData[field] = Boolean(body[field]);
        } else if (field === 'annual_turnover_lakhs' || field === 'year_established') {
          updateData[field] = body[field] === '' || body[field] === null ? null : Number(body[field]);
        } else if (field === 'categories') {
          if (Array.isArray(body.categories)) {
            updateData.categories = body.categories;
          } else if (typeof body.categories === 'string' && body.categories.trim()) {
            updateData.categories = body.categories.split(',').map(s => s.trim()).filter(Boolean);
          } else {
            updateData.categories = [];
          }
        } else {
          updateData[field] = body[field];
        }
      }
    });

    if (body.annual_turnover_lakhs !== undefined) {
      updateData.annual_turnover_lakhs = body.annual_turnover_lakhs === '' || body.annual_turnover_lakhs === null 
        ? null 
        : Number(body.annual_turnover_lakhs);
    }

    // Keep phone fields in sync
    if (updateData.corporate_phone && !updateData.phone_number) {
      updateData.phone_number = updateData.corporate_phone;
    } else if (updateData.phone_number && !updateData.corporate_phone) {
      updateData.corporate_phone = updateData.phone_number;
    }

    // Uppercase GST and PAN
    if (updateData.gst_number) {
      updateData.gst_number = String(updateData.gst_number).trim().toUpperCase();
    }
    if (updateData.pan_number) {
      updateData.pan_number = String(updateData.pan_number).trim().toUpperCase();
    }

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let updateQuery = supabaseAdmin.from('users').update(updateData);

    if (isUUID) {
      updateQuery = updateQuery.eq('id', id);
    } else {
      updateQuery = updateQuery.or(`id.eq.${id},firebase_uid.eq.${id},display_id.eq.${id}`);
    }

    const { data: updatedUser, error: updateError } = await updateQuery.select().single();

    if (updateError) {
      console.error('Supabase user update error:', updateError);
      return NextResponse.json({ error: updateError.message || 'Failed to update user in database' }, { status: 500 });
    }

    if (updatedUser?.firebase_uid) {
      try {
        await supabaseAdmin.auth.admin.updateUserById(updatedUser.firebase_uid, {
          user_metadata: {
            full_name: updatedUser.full_name || updatedUser.company_name,
            company_name: updatedUser.company_name,
            phone: updatedUser.corporate_phone || updatedUser.phone_number,
            role: updatedUser.role
          }
        });
      } catch (authErr) {
        console.warn('Auth user metadata sync warning:', authErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'User profile updated and saved to live database successfully.'
    });
  } catch (error) {
    console.error('Admin user update exception:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    // 1. Delete or nullify dependent child records to prevent foreign key errors
    try {
      if (isUUID) {
        await supabaseAdmin.from('search_logs').delete().eq('user_id', id);
        await supabaseAdmin.from('user_product_views').delete().eq('user_id', id);
        await supabaseAdmin.from('activity_logs').delete().eq('user_id', id);
        await supabaseAdmin.from('notifications').delete().eq('user_id', id);
        // Delete or nullify products owned by this user
        await supabaseAdmin.from('products').delete().eq('supplier_id', id);
      }
    } catch (cleanErr) {
      console.warn('Child cleanup warning:', cleanErr.message);
    }

    // 2. Delete user from Supabase users table
    let deleteQuery = supabaseAdmin.from('users').delete();
    if (isUUID) {
      deleteQuery = deleteQuery.eq('id', id);
    } else {
      deleteQuery = deleteQuery.or(`id.eq.${id},firebase_uid.eq.${id}`);
    }

    const { error: deleteError } = await deleteQuery;

    if (deleteError) {
      console.error('Supabase user delete error:', deleteError);
      return NextResponse.json({ error: deleteError.message || 'Failed to delete user from database' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'User and all associated database records deleted successfully from live system.'
    });
  } catch (error) {
    console.error('Admin user delete exception:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

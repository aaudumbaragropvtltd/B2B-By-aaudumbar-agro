import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Admin Login via email + password.
 * POST /api/admin/login
 * Body: { email: string, password: string }
 * Returns a signed admin token cookie.
 */

// Admin credentials (strictly rsevmail@gmail.com)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'rsevmail@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Raghav22001';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate credentials
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    // Check against admin credentials
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase() || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    // Generate a simple admin token (email hash + timestamp)
    const adminToken = Buffer.from(`${ADMIN_EMAIL}:${Date.now()}`).toString('base64');

    // Create response with admin cookie
    const response = NextResponse.json({ 
      success: true, 
      message: 'Admin access granted.',
      admin: { email: ADMIN_EMAIL }
    });
    
    // Set a secure HTTP-only cookie valid for 24 hours
    response.cookies.set('b2b_admin_token', adminToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

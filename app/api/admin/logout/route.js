// ============================================================================
// ADMIN LOGOUT API
// ============================================================================
// Clears the b2b_admin_token cookie to revoke admin session.
// ============================================================================

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Admin logged out' });
  response.cookies.set('b2b_admin_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
    expires: new Date(0),
  });
  return response;
}

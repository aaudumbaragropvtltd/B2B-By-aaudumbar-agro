// ============================================================================
// ADMIN RESET PASSWORD API
// ============================================================================
// Admin-only endpoint to reset any user's password.
// Generates a new password, updates it in Supabase Auth, and emails the user.
// ============================================================================

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

function verifyAdminCookie() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('b2b_admin_token')?.value;
    return !!token;
  } catch {
    return false;
  }
}

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function POST(request) {
  try {
    const isAdmin = verifyAdminCookie();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, userEmail } = body;

    if (!userId || !userEmail) {
      return NextResponse.json({ error: 'User ID and email are required.' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get the user's firebase_uid to find their Supabase Auth account
    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('firebase_uid, company_name')
      .eq('id', userId)
      .single();

    if (!userProfile || !userProfile.firebase_uid) {
      return NextResponse.json({ error: 'User not found or has no auth account.' }, { status: 404 });
    }

    // Generate new password
    const newPassword = generatePassword();

    // Update password in Supabase Auth
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userProfile.firebase_uid,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Failed to update password:', updateError);
      return NextResponse.json({ error: 'Failed to reset password.' }, { status: 500 });
    }

    // Brand colors
    const navy = '#1B3A5C';
    const orange = '#E8792B';

    // Send email with new password
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'b2bbharat.in@gmail.com',
        pass: 'jrwgvucuxrbepnei',
      },
    });

    const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:24px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background: linear-gradient(135deg, ${navy} 0%, #234b73 100%);padding:28px 36px;text-align:center;">
            <div style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:1px;">B2B INDIA</div>
            <div style="font-size:11px;color:${orange};font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-top:4px;">by Aaudumbar Agro Pvt. Ltd.</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 36px;">
            <h2 style="margin:0 0 8px;font-size:20px;color:${navy};font-weight:800;">Your Password Has Been Reset</h2>
            <p style="margin:0 0 20px;font-size:14px;color:#666;line-height:1.6;">
              Hello${userProfile.company_name ? ' ' + userProfile.company_name : ''},
            </p>
            <p style="margin:0 0 16px;font-size:14px;color:#555;line-height:1.6;">
              Your B2B India account password has been reset by the admin team. Here are your new login credentials:
            </p>
            
            <div style="background:#f0f4f8;border-radius:10px;padding:20px 24px;margin:24px 0;border:1px solid #e1e8ef;">
              <table cellpadding="0" cellspacing="0" style="width:100%;">
                <tr>
                  <td style="font-size:12px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:1px;padding-bottom:8px;">Email</td>
                  <td style="font-size:14px;color:${navy};font-weight:700;padding-bottom:8px;text-align:right;">${userEmail}</td>
                </tr>
                <tr>
                  <td style="font-size:12px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:1px;padding-top:8px;border-top:1px solid #dde3ea;">New Password</td>
                  <td style="font-size:16px;color:${orange};font-weight:800;padding-top:8px;border-top:1px solid #dde3ea;text-align:right;font-family:monospace;letter-spacing:1px;">${newPassword}</td>
                </tr>
              </table>
            </div>

            <p style="margin:0 0 8px;font-size:12px;color:#999;line-height:1.6;">
              Please login with the new password and change it to something you can remember. For security, do not share this email with anyone.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:${navy};padding:20px 36px;text-align:center;">
            <div style="font-size:12px;color:#fff;opacity:0.8;">
              <strong>Aaudumbar Agro Pvt. Ltd.</strong><br>
              <span style="font-size:11px;opacity:0.7;">📞 +91 84088 41998 | ✉ b2bbharat.in@gmail.com</span>
            </div>
          </td>
        </tr>
        <tr>
          <td style="height:4px;background:linear-gradient(90deg, ${navy}, ${orange}, #4A8C3F);"></td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await transporter.sendMail({
      from: '"B2B India" <b2bbharat.in@gmail.com>',
      to: userEmail,
      subject: 'Your Password Has Been Reset — B2B India',
      text: `Your B2B India password has been reset.\n\nEmail: ${userEmail}\nNew Password: ${newPassword}\n\nPlease login and change your password.\n\n— B2B India by Aaudumbar Agro Pvt. Ltd.`,
      html: htmlContent,
    });

    return NextResponse.json({ 
      success: true, 
      message: `Password reset successfully. New credentials emailed to ${userEmail}.` 
    });

  } catch (error) {
    console.error('Admin reset password error:', error);
    return NextResponse.json({ error: 'Failed to reset password.' }, { status: 500 });
  }
}

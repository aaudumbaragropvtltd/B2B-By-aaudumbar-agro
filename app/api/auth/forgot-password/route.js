// ============================================================================
// FORGOT PASSWORD API
// ============================================================================
// Public endpoint for password recovery.
// Sends a password reset link to the user's email via Nodemailer.
// Uses Supabase Admin to generate a recovery link.
// ============================================================================

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Check if the user exists in our users table
    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('id, company_name, registered_email')
      .eq('registered_email', email.trim().toLowerCase())
      .single();

    if (!userProfile) {
      // Don't reveal if user exists or not (security best practice)
      // But since the user requested we send to the email, we return success anyway
      return NextResponse.json({ 
        success: true, 
        message: 'If this email is registered, you will receive a password reset link shortly.' 
      });
    }

    // Generate password reset link via Supabase Admin
    // Determine site origin
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'www.b2bindia.site';
    const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const origin = request.headers.get('origin') || `${proto}://${host}`;
    
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email.trim().toLowerCase(),
      options: {
        redirectTo: `${origin}/reset-password`,
      },
    });

    if (linkError) {
      console.error('Failed to generate recovery link:', linkError);
      return NextResponse.json({ 
        success: true, 
        message: 'If this email is registered, you will receive a password reset link shortly.' 
      });
    }

    const hashedToken = linkData?.properties?.hashed_token || '';
    const emailOtp = linkData?.properties?.email_otp || '';
    const resetLink = `${origin}/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}&otp=${emailOtp}&token_hash=${hashedToken}`;
    const loginResetLink = `${origin}/login?reset=true&email=${encodeURIComponent(email.trim().toLowerCase())}&otp=${emailOtp}`;

    // Brand colors
    const navy = '#1B3A5C';
    const orange = '#E8792B';

    // Send email via Nodemailer
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
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Reset Your Password — B2B India</title></head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:24px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <tr>
          <td style="background: linear-gradient(135deg, ${navy} 0%, #234b73 100%);padding:28px 36px;text-align:center;">
            <div style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:1px;">B2B INDIA</div>
            <div style="font-size:11px;color:${orange};font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-top:4px;">by Aaudumbar Agro Pvt. Ltd.</div>
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td style="padding:32px 36px;">
            <h2 style="margin:0 0 8px;font-size:20px;color:${navy};font-weight:800;">Password Reset Request</h2>
            <p style="margin:0 0 16px;font-size:14px;color:#666;line-height:1.6;">
              Hello${userProfile.company_name ? ' ' + userProfile.company_name : ''},
            </p>
            <p style="margin:0 0 20px;font-size:14px;color:#555;line-height:1.6;">
              We received a request to reset the password for your B2B India account (<strong>${email}</strong>). You can enter the 8-digit OTP code below directly on the login screen, or click the reset button:
            </p>

            <!-- OTP Code Box (Prominent & First) -->
            ${emailOtp ? `
            <div style="background:#f0fdf4;border:2px dashed #22c55e;border-radius:14px;padding:22px;text-align:center;margin:20px 0;">
              <div style="font-size:11px;font-weight:800;color:#15803d;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;">
                Your 8-Digit Password Reset OTP
              </div>
              <div style="font-size:34px;font-weight:900;letter-spacing:8px;color:${navy};font-family:monospace;padding:4px 0;">
                ${emailOtp}
              </div>
              <div style="font-size:12px;color:#166534;margin-top:6px;font-weight:600;">
                Enter this 8-digit code on the login screen to set your new password instantly.
              </div>
            </div>
            ` : ''}
            
            <!-- Direct CTA Button -->
            <div style="text-align:center;margin:24px 0 16px;">
              <a href="${resetLink}" target="_blank" style="display:inline-block;background:linear-gradient(135deg, ${orange}, #d06820);color:#ffffff;font-size:15px;font-weight:800;text-decoration:none;padding:14px 40px;border-radius:10px;letter-spacing:0.5px;box-shadow:0 4px 14px rgba(232,121,43,0.35);">
                🔐 Click to Set New Password
              </a>
            </div>

            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px 16px;margin:20px 0;font-size:12px;color:#1e40af;line-height:1.5;">
              📱 <strong>Opening this email on your mobile phone?</strong><br>
              No need to click! Just enter the 8-digit OTP code <strong>${emailOtp}</strong> into the password reset box on your computer screen.
            </div>

            <p style="margin:0 0 8px;font-size:12px;color:#999;line-height:1.6;">
              This link and OTP will expire in 1 hour. If you didn&apos;t request a password reset, you can safely ignore this email — your password will remain unchanged.
            </p>
            
            <div style="margin-top:16px;padding:12px 16px;background:#f8f9fa;border-radius:8px;border-left:3px solid ${orange};">
              <p style="margin:0;font-size:11px;color:#888;">
                If the button doesn&apos;t open, copy and paste this link into your browser:<br>
                <a href="${resetLink}" style="color:${orange};word-break:break-all;font-size:10px;">${resetLink}</a>
              </p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:${navy};padding:20px 36px;text-align:center;">
            <div style="font-size:12px;color:#fff;opacity:0.8;">
              <strong>Aaudumbar Agro Pvt. Ltd.</strong><br>
              <span style="font-size:11px;opacity:0.7;">📞 +91 84088 41998 | ✉ b2bbharat.in@gmail.com</span>
            </div>
          </td>
        </tr>

        <!-- Bottom accent -->
        <tr>
          <td style="height:4px;background:linear-gradient(90deg, ${navy}, ${orange}, #4A8C3F);"></td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const textContent = `Password Reset Request

Hello${userProfile.company_name ? ' ' + userProfile.company_name : ''},

We received a request to reset the password for your B2B India account (${email}).

Reset your password using this link:
${resetLink}

${emailOtp ? `Your 8-Digit Password Reset OTP: ${emailOtp}\n` : ''}
This link expires in 1 hour. If you didn't request this, ignore this email.

— B2B India by Aaudumbar Agro Pvt. Ltd.
📞 +91 84088 41998 | ✉ b2bbharat.in@gmail.com`;

    await transporter.sendMail({
      from: '"B2B India" <b2bbharat.in@gmail.com>',
      to: email.trim(),
      subject: 'Reset Your Password — B2B India OTP & Link',
      text: textContent,
      html: htmlContent,
    });

    return NextResponse.json({ 
      success: true, 
      email: email.trim().toLowerCase(),
      message: 'Password reset link and OTP code have been dispatched to your email address.' 
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Failed to process password reset. Please try again.' }, { status: 500 });
  }
}

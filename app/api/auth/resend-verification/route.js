// ============================================================================
// RESEND VERIFICATION EMAIL API
// ============================================================================
// Generates a new verification link & OTP for an existing unconfirmed user
// and sends an official branded verification email via Nodemailer.
// ============================================================================

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body;

    const emailTrimmed = email ? email.trim().toLowerCase() : '';

    if (!emailTrimmed || !emailTrimmed.includes('@')) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    // Determine site origin
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'www.b2bindia.site';
    const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const origin = request.headers.get('origin') || `${proto}://${host}`;

    // Generate link for unconfirmed user - try signup first, fallback to magiclink
    let linkData = null;
    let linkError = null;

    const resSignup = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: emailTrimmed,
      options: {
        redirectTo: `${origin}/api/auth/confirm`,
      },
    });

    if (resSignup.error) {
      if (resSignup.error.message?.toLowerCase().includes('already been registered')) {
        return NextResponse.json({
          success: true,
          message: 'This email is already verified. You can log in directly.',
          alreadyVerified: true,
        });
      }

      // Try magiclink as fallback
      const resMagic = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: emailTrimmed,
        options: {
          redirectTo: `${origin}/api/auth/confirm`,
        },
      });

      if (resMagic.error) {
        return NextResponse.json(
          { error: resSignup.error.message || 'Unable to generate verification email. Please try registering first.' },
          { status: 400 }
        );
      }

      linkData = resMagic.data;
    } else {
      linkData = resSignup.data;
    }

    const properties = linkData?.properties || {};
    const hashedToken = properties.hashed_token || '';
    const emailOtp = properties.email_otp || '';
    const appConfirmLink = `${origin}/api/auth/confirm?token_hash=${hashedToken}&type=signup`;

    // Send email via Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'b2bbharat.in@gmail.com',
        pass: 'jrwgvucuxrbepnei',
      },
    });

    const navy = '#1B3A5C';
    const orange = '#E8792B';
    const green = '#16a34a';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your Email — B2B India</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Roboto,-apple-system,BlinkMacSystemFont,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 12px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(15,23,42,0.08);max-width:100%;">
          
          <!-- Brand Header -->
          <tr>
            <td style="background:linear-gradient(135deg, ${navy} 0%, #0f2744 100%);padding:36px 40px;text-align:center;">
              <div style="display:inline-block;padding:8px 24px;border-radius:12px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);margin-bottom:12px;">
                <span style="font-size:26px;font-weight:900;color:#ffffff;letter-spacing:1px;">B2B INDIA</span>
              </div>
              <div style="font-size:12px;color:${orange};font-weight:800;letter-spacing:2px;text-transform:uppercase;">
                Aaudumbar Agro Pvt. Ltd. Trade Network
              </div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:40px 40px 32px 40px;">
              <h2 style="margin:0 0 12px;font-size:22px;color:${navy};font-weight:800;">
                Your New Verification Link
              </h2>
              <p style="margin:0 0 18px;font-size:15px;color:#475569;line-height:1.6;">
                You requested a new verification link for your B2B India account (<strong>${emailTrimmed}</strong>).
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.6;">
                Click the button below to confirm your email address and activate your wholesale access:
              </p>

              <!-- CTA Button -->
              <div style="text-align:center;margin:32px 0;">
                <a href="${appConfirmLink}" target="_blank" style="display:inline-block;background:linear-gradient(135deg, ${green} 0%, #15803d 100%);color:#ffffff;font-size:16px;font-weight:800;text-decoration:none;padding:16px 44px;border-radius:12px;box-shadow:0 4px 16px rgba(22,163,74,0.35);letter-spacing:0.3px;">
                  ✅ Verify & Activate Account
                </a>
              </div>

              <!-- OTP Code Option -->
              ${emailOtp ? `
              <div style="background:#f0fdf4;border:2px dashed #86efac;border-radius:12px;padding:20px;text-align:center;margin:28px 0;">
                <div style="font-size:12px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">
                  Your Verification Code (OTP)
                </div>
                <div style="font-size:32px;font-weight:900;letter-spacing:6px;color:${navy};font-family:monospace;">
                  ${emailOtp}
                </div>
                <div style="font-size:12px;color:#15803d;margin-top:6px;">
                  Enter this code on the registration page to activate immediately.
                </div>
              </div>
              ` : ''}

              <!-- Security Notice -->
              <div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:14px 18px;border-radius:8px;margin-top:28px;">
                <p style="margin:0;font-size:12px;color:#92400e;line-height:1.5;">
                  <strong>Note:</strong> This link expires in 24 hours. If you did not make this request, you can safely ignore this email.
                </p>
              </div>

              <!-- Fallback Direct Link -->
              <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e2e8f0;">
                <p style="margin:0 0 6px;font-size:12px;color:#64748b;">
                  Direct link:
                </p>
                <a href="${appConfirmLink}" style="font-size:11px;color:${orange};word-break:break-all;text-decoration:underline;">
                  ${appConfirmLink}
                </a>
              </div>
            </td>
          </tr>

          <!-- Corporate Footer -->
          <tr>
            <td style="background:${navy};padding:24px 40px;text-align:center;">
              <div style="font-size:13px;color:#ffffff;font-weight:700;margin-bottom:4px;">
                Aaudumbar Agro Pvt. Ltd.
              </div>
              <div style="font-size:11px;color:#94a3b8;line-height:1.6;">
                Corporate Office: Maharashtra, India<br>
                GSTIN: 27ABACA6256A1Z2 | Support Helpline: +91 84088 41998<br>
                Official Desk: b2bbharat.in@gmail.com
              </div>
            </td>
          </tr>

          <!-- Accent Bar -->
          <tr>
            <td style="height:5px;background:linear-gradient(90deg, #1B3A5C 0%, #E8792B 50%, #16a34a 100%);"></td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    await transporter.sendMail({
      from: '"B2B India" <b2bbharat.in@gmail.com>',
      to: emailTrimmed,
      subject: 'New Verification Link for B2B India Account',
      html: htmlContent,
    });

    return NextResponse.json({
      success: true,
      message: `A fresh verification link has been sent to ${emailTrimmed}.`,
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to resend verification email.' },
      { status: 500 }
    );
  }
}

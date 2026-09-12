import fs from 'fs';
import path from 'path';

const getMembershipsFilePath = () => path.join(process.cwd(), 'data', 'memberships.json');

export function readMemberships() {
  try {
    const filePath = getMembershipsFilePath();
    if (!fs.existsSync(filePath)) {
      return {};
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data || '{}');
  } catch (err) {
    console.error('Error reading memberships file:', err);
    return {};
  }
}

export function writeMemberships(data) {
  try {
    const filePath = getMembershipsFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing memberships file:', err);
    return false;
  }
}

/**
 * Get active membership for a user by user_id or email
 */
export function getUserMembership(userId, email) {
  const memberships = readMemberships();
  const key = userId || email?.toLowerCase();
  
  let userSub = memberships[key];
  if (!userSub && email) {
    userSub = memberships[email.toLowerCase()];
  }

  if (!userSub) {
    return {
      plan: 'FREE TIER',
      rawPlan: 'FREE TIER',
      status: 'active',
      canUpload: false,
      expiresAt: null,
      expiresAtFormatted: null,
      daysLeft: 0,
      isExpired: false,
      isExpiringSoon: false,
    };
  }

  const now = new Date();
  let daysLeft = 0;
  let isExpired = false;
  let expiresAtFormatted = null;

  if (userSub.expiresAt) {
    const expDate = new Date(userSub.expiresAt);
    expiresAtFormatted = expDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    const diffMs = expDate.getTime() - now.getTime();
    daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (daysLeft <= 0) {
      isExpired = true;
      daysLeft = 0;
    }
  }

  if (isExpired) {
    return {
      plan: 'FREE TIER',
      rawPlan: userSub.plan,
      status: 'expired',
      canUpload: false,
      expiresAt: userSub.expiresAt,
      expiresAtFormatted,
      daysLeft: 0,
      isExpired: true,
      isExpiringSoon: false,
      previousPlan: userSub.plan,
    };
  }

  return {
    plan: userSub.plan || 'FREE TIER',
    rawPlan: userSub.plan,
    status: 'active',
    canUpload: userSub.plan !== 'FREE TIER',
    expiresAt: userSub.expiresAt,
    expiresAtFormatted,
    daysLeft,
    isExpiringSoon: daysLeft > 0 && daysLeft <= 14,
    isExpired: false,
    activatedAt: userSub.activatedAt,
    paymentId: userSub.paymentId,
  };
}

/**
 * Save / Upgrade user membership
 */
export function saveUserMembership(userId, email, { plan, paymentId, razorpayOrderId, paymentMethod = 'razorpay', notes = null, daysOverride = null }) {
  const memberships = readMemberships();
  const now = new Date();
  
  let days = daysOverride || (plan === 'ANNUAL PLAN' ? 365 : 90);

  const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

  const record = {
    userId: userId || null,
    email: email ? email.toLowerCase() : null,
    plan,
    status: 'active',
    activatedAt: now.toISOString(),
    expiresAt,
    daysTotal: days,
    paymentId: paymentId || null,
    razorpayOrderId: razorpayOrderId || null,
    paymentMethod,
    notes: notes || null,
    lastReminderSentAt: null,
  };

  if (userId) {
    memberships[userId] = record;
  }
  if (email) {
    memberships[email.toLowerCase()] = record;
  }

  writeMemberships(memberships);
  return record;
}

/**
 * Manually activate membership from Admin Panel
 */
export function manualActivateMembership({ userId, email, plan = 'QUARTERLY PLAN', days = 90, paymentId, notes = 'Activated manually via Admin Panel', activatedBy = 'admin' }) {
  const memberships = readMemberships();
  const now = new Date();
  const targetDays = days || (plan === 'ANNUAL PLAN' ? 365 : 90);
  const expiresAt = new Date(now.getTime() + targetDays * 24 * 60 * 60 * 1000).toISOString();

  const refPaymentId = paymentId || `MANUAL-${Date.now().toString().slice(-6)}`;

  const record = {
    userId: userId || null,
    email: email ? email.toLowerCase() : null,
    plan,
    status: 'active',
    activatedAt: now.toISOString(),
    expiresAt,
    daysTotal: targetDays,
    paymentId: refPaymentId,
    paymentMethod: 'manual_admin',
    activatedBy,
    notes,
    lastUpdated: now.toISOString(),
  };

  if (userId) {
    memberships[userId] = record;
  }
  if (email) {
    memberships[email.toLowerCase()] = record;
  }

  writeMemberships(memberships);
  return record;
}

/**
 * Manually deactivate / expire membership
 */
export function deactivateUserMembership(userId, email, reason = 'Deactivated by Admin') {
  const memberships = readMemberships();
  const now = new Date();
  const key = userId || email?.toLowerCase();
  const existing = memberships[key] || {};

  const record = {
    ...existing,
    userId: userId || existing.userId || null,
    email: email ? email.toLowerCase() : existing.email || null,
    status: 'expired',
    plan: 'FREE TIER',
    previousPlan: existing.plan || 'QUARTERLY PLAN',
    expiresAt: now.toISOString(),
    notes: reason,
    lastUpdated: now.toISOString(),
  };

  if (userId) {
    memberships[userId] = record;
  }
  if (email) {
    memberships[email.toLowerCase()] = record;
  }

  writeMemberships(memberships);
  return record;
}

/**
 * Record timestamp when payment reminder was sent
 */
export function recordReminderSent(userId, email) {
  const memberships = readMemberships();
  const now = new Date().toISOString();
  const key = userId || email?.toLowerCase();
  
  if (userId && memberships[userId]) {
    memberships[userId].lastReminderSentAt = now;
  }
  if (email && memberships[email.toLowerCase()]) {
    memberships[email.toLowerCase()].lastReminderSentAt = now;
  }

  writeMemberships(memberships);
  return now;
}

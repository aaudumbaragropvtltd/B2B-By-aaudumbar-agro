// ============================================================================
// B2B INDIA — PLATFORM AUDIT & HEALTH LOGS ENGINE
// ============================================================================
// Stores and retrieves API transactions, webhook traces, and system error events.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const LOGS_FILE_PATH = path.join(process.cwd(), 'data', 'platform_logs.json');
const MAX_LOCAL_LOGS = 200;

function getSupabaseAdmin() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return null;
}

function readLocalLogs() {
  try {
    if (!fs.existsSync(path.dirname(LOGS_FILE_PATH))) {
      fs.mkdirSync(path.dirname(LOGS_FILE_PATH), { recursive: true });
    }
    if (fs.existsSync(LOGS_FILE_PATH)) {
      const data = fs.readFileSync(LOGS_FILE_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {}
  return [];
}

function writeLocalLogs(logs) {
  try {
    if (!fs.existsSync(path.dirname(LOGS_FILE_PATH))) {
      fs.mkdirSync(path.dirname(LOGS_FILE_PATH), { recursive: true });
    }
    // Retain only latest logs to prevent memory buildup
    const trimmed = logs.slice(0, MAX_LOCAL_LOGS);
    fs.writeFileSync(LOGS_FILE_PATH, JSON.stringify(trimmed, null, 2), 'utf8');
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Record a system event or error.
 */
export async function logPlatformEvent({ level = 'INFO', service = 'api', message, metadata = {} }) {
  const logEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    level: level.toUpperCase(),
    service: service.toLowerCase(),
    message: String(message),
    metadata: typeof metadata === 'object' ? metadata : { raw: metadata },
    created_at: new Date().toISOString(),
  };

  const logs = readLocalLogs();
  logs.unshift(logEntry);
  writeLocalLogs(logs);

  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      await supabase.from('platform_logs').insert([logEntry]);
    } catch (e) {}
  }

  return logEntry;
}

/**
 * Get system audit logs with optional filtering.
 */
export async function getPlatformLogs({ level = null, service = null, limit = 50 } = {}) {
  let logs = readLocalLogs();
  const supabase = getSupabaseAdmin();

  if (supabase) {
    try {
      let query = supabase.from('platform_logs').select('*').order('created_at', { ascending: false }).limit(limit);
      if (level && level !== 'ALL') query = query.eq('level', level);
      if (service && service !== 'ALL') query = query.eq('service', service);
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (e) {}
  }

  if (level && level !== 'ALL') {
    logs = logs.filter((l) => l.level === level.toUpperCase());
  }
  if (service && service !== 'ALL') {
    logs = logs.filter((l) => l.service === service.toLowerCase());
  }

  return logs.slice(0, limit);
}

/**
 * Clear all local logs.
 */
export function clearPlatformLogs() {
  writeLocalLogs([]);
  return true;
}

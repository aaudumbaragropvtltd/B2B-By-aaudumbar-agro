-- ============================================================================
-- UPGRADE ACCOUNT TO ADMIN
-- ============================================================================
-- Run this in Supabase SQL Editor to grant yourself admin access.
-- ============================================================================

-- If your email is different, replace 'rsevmail@gmail.com' with your actual login email.
UPDATE users 
SET role = 'admin' 
WHERE registered_email = 'rsevmail@gmail.com';

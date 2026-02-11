-- Add role column to users table for database-level admin access control
-- Run this migration in your Supabase SQL Editor

-- Add role column with constraint
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'
  CHECK (role IN ('user', 'admin', 'founder'));

-- Create index for efficient role lookups
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create policy for admins to view all messages
CREATE POLICY "Admins can view all messages" ON messages
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'founder'))
  );

-- Create policy for admins to view all users
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'founder'))
  );

-- Create policy for admins to view all intentions
CREATE POLICY "Admins can view all intentions" ON intentions
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'founder'))
  );

-- After running this migration, update your admin user:
-- UPDATE users SET role = 'founder' WHERE email = 'your-admin-email@example.com';

/*
  # Fix Admin Password

  1. Changes
    - Delete existing admin user from auth.users and profiles
    - Recreate admin user with correct password via auth.users insert
    - Ensure profile is linked correctly

  This migration ensures the admin account has the password 'sasan123'
*/

-- Delete existing admin profile and auth user
DELETE FROM profiles WHERE username = 'admin';
DELETE FROM auth.users WHERE email = 'admin@damon.local';

-- Insert new admin user into auth.users with proper password hash
-- Password: sasan123
-- This uses pgcrypto to hash the password
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '77bdc6ca-4cc7-495d-9696-52543b5e57a9',
  'authenticated',
  'authenticated',
  'admin@damon.local',
  crypt('sasan123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  '',
  '',
  '',
  ''
);

-- Create matching profile
INSERT INTO profiles (id, username, full_name, role, is_active, created_at)
VALUES (
  '77bdc6ca-4cc7-495d-9696-52543b5e57a9',
  'admin',
  'مدیر سیستم',
  'admin',
  true,
  NOW()
);

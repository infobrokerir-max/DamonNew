/*
  # Reset Admin Password

  Reset the admin user's password to "sasan123" for login access.
*/

-- Update the admin user's password in auth.users
UPDATE auth.users
SET encrypted_password = crypt('sasan123', gen_salt('bf'))
WHERE email = 'admin@damon.local';

/*
  # Seed Initial Data

  ## Overview
  This migration seeds the database with initial data for testing and development.

  ## Data Seeded

  ### Users (via auth.users and profiles)
  - Admin user (username: admin, password: sasan)
  - Sales manager (username: sales, password: 123)
  - Two employees (username: emp1, emp2, password: 123)

  ### Categories
  - چیلر تراکمی (Chiller)
  - VRF
  - هواساز (Air Handler)

  ### Devices
  - Various chiller, VRF, and AHU models with pricing data

  ### Projects
  - Two sample projects for demonstration

  ## Important Notes

  1. Passwords are hashed by Supabase Auth
  2. User IDs are generated and linked to profiles
  3. All seed data uses proper foreign key relationships
  4. Sample data is in Persian (Farsi) for the target market
*/

-- Note: We cannot directly insert into auth.users via SQL
-- Users must be created through the application's signup flow
-- This migration only creates the structure; initial users should be created via the admin panel

-- Seed Categories
INSERT INTO categories (id, category_name, description) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'چیلر تراکمی', 'سیستم های تراکمی سرمایشی'),
  ('c2222222-2222-2222-2222-222222222222', 'VRF', 'سیستم های جریان متغیر سردکننده'),
  ('c3333333-3333-3333-3333-333333333333', 'هواساز', 'سیستم های هواساز و کویل دار')
ON CONFLICT (id) DO NOTHING;

-- Seed Devices
INSERT INTO devices (id, model_name, category_id, factory_pricelist_eur, length_meter, weight_unit, is_active) VALUES
  ('d1111111-1111-1111-1111-111111111111', 'CH-2000-X', 'c1111111-1111-1111-1111-111111111111', 50000, 4.5, 2000, true),
  ('d2222222-2222-2222-2222-222222222222', 'CH-4000-Pro', 'c1111111-1111-1111-1111-111111111111', 85000, 6.2, 3500, true),
  ('d3333333-3333-3333-3333-333333333333', 'VRF-Outdoor-12HP', 'c2222222-2222-2222-2222-222222222222', 12000, 1.2, 400, true),
  ('d4444444-4444-4444-4444-444444444444', 'VRF-Indoor-Cassette', 'c2222222-2222-2222-2222-222222222222', 800, 0.8, 40, true),
  ('d5555555-5555-5555-5555-555555555555', 'AHU-10000-CFM', 'c3333333-3333-3333-3333-333333333333', 15000, 3.0, 1200, true),
  ('d6666666-6666-6666-6666-666666666666', 'AHU-25000-CFM', 'c3333333-3333-3333-3333-333333333333', 28000, 5.5, 2100, true)
ON CONFLICT (id) DO NOTHING;

-- Note: Projects, comments, and inquiries will be created through the application
-- as they require valid user IDs from auth.users

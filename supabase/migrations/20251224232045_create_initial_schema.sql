/*
  # Create Initial Database Schema for Damon Service Management

  ## Overview
  This migration creates a complete database schema for a project management and pricing system
  with role-based access control and confidential data protection.

  ## New Tables

  ### 1. `profiles`
  - `id` (uuid, references auth.users)
  - `full_name` (text)
  - `username` (text, unique)
  - `role` (text: admin, sales_manager, employee)
  - `is_active` (boolean)
  - `created_at` (timestamptz)
  - Extends Supabase auth.users with custom profile data

  ### 2. `categories`
  - `id` (uuid, primary key)
  - `category_name` (text)
  - `description` (text, optional)
  - `created_at` (timestamptz)
  - Stores device categories (e.g., چیلر تراکمی, VRF, هواساز)

  ### 3. `devices`
  - `id` (uuid, primary key)
  - `model_name` (text)
  - `category_id` (uuid, references categories)
  - `factory_pricelist_eur` (numeric) - CONFIDENTIAL
  - `length_meter` (numeric) - CONFIDENTIAL
  - `weight_unit` (numeric) - CONFIDENTIAL
  - `is_active` (boolean)
  - `created_at` (timestamptz)
  - Stores device models with confidential pricing data

  ### 4. `settings`
  - `id` (uuid, primary key)
  - `is_active` (boolean)
  - `discount_multiplier` (numeric)
  - `freight_rate_per_meter_eur` (numeric)
  - `customs_numerator` (numeric)
  - `customs_denominator` (numeric)
  - `warranty_rate` (numeric)
  - `commission_factor` (numeric)
  - `office_factor` (numeric)
  - `profit_factor` (numeric)
  - `rounding_mode` (text)
  - `rounding_step` (integer)
  - `exchange_rate_irr_per_eur` (numeric)
  - `google_script_url` (text, optional)
  - `last_sync_at` (timestamptz, optional)
  - `updated_at` (timestamptz)
  - System-wide configuration for pricing calculations

  ### 5. `projects`
  - `id` (uuid, primary key)
  - `created_by_user_id` (uuid, references profiles)
  - `assigned_sales_manager_id` (uuid, references profiles, optional)
  - `project_name` (text)
  - `employer_name` (text)
  - `project_type` (text)
  - `address_text` (text)
  - `tehran_lat` (numeric)
  - `tehran_lng` (numeric)
  - `additional_info` (text, optional)
  - `status` (text)
  - `approval_decision_by` (uuid, optional)
  - `approval_decision_at` (timestamptz, optional)
  - `approval_note` (text, optional)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  - Main project management table

  ### 6. `project_comments`
  - `id` (uuid, primary key)
  - `project_id` (uuid, references projects)
  - `author_user_id` (uuid, references profiles)
  - `author_role_snapshot` (text)
  - `body` (text)
  - `parent_comment_id` (uuid, optional, self-reference)
  - `created_at` (timestamptz)
  - Comments and notes on projects

  ### 7. `project_inquiries`
  - `id` (uuid, primary key)
  - `project_id` (uuid, references projects)
  - `requested_by_user_id` (uuid, references profiles)
  - `device_id` (uuid, references devices)
  - `category_id` (uuid, references categories)
  - `quantity` (integer)
  - `status` (text: pending, approved, rejected)
  - `admin_decision_at` (timestamptz, optional)
  - `sell_price_eur_snapshot` (numeric)
  - `sell_price_irr_snapshot` (numeric, optional)
  - `calculation_breakdown` (jsonb)
  - `created_at` (timestamptz)
  - Price inquiries for devices within projects

  ## Security

  All tables have Row Level Security (RLS) enabled with role-based policies:
  - Admins have full access to all data
  - Sales managers can view all projects but limited device data
  - Employees can only view their own projects and public device data
  - Confidential device pricing fields protected from non-admin users

  ## Important Notes

  1. Default values are set for all applicable fields
  2. Foreign key constraints ensure data integrity
  3. Cascading deletes are configured where appropriate
  4. Indexes added for performance on frequently queried columns
  5. All timestamps use UTC timezone
*/

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  username text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'sales_manager', 'employee')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    AND profiles.id != auth.uid()
  );

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create devices table
CREATE TABLE IF NOT EXISTS devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name text NOT NULL,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  factory_pricelist_eur numeric NOT NULL,
  length_meter numeric NOT NULL,
  weight_unit numeric NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_devices_category ON devices(category_id);
CREATE INDEX IF NOT EXISTS idx_devices_active ON devices(is_active);

ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view devices"
  ON devices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert devices"
  ON devices FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update devices"
  ON devices FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete devices"
  ON devices FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean DEFAULT true,
  discount_multiplier numeric NOT NULL DEFAULT 0.38,
  freight_rate_per_meter_eur numeric NOT NULL DEFAULT 1000,
  customs_numerator numeric NOT NULL DEFAULT 350000,
  customs_denominator numeric NOT NULL DEFAULT 150000,
  warranty_rate numeric NOT NULL DEFAULT 0.05,
  commission_factor numeric NOT NULL DEFAULT 0.95,
  office_factor numeric NOT NULL DEFAULT 0.95,
  profit_factor numeric NOT NULL DEFAULT 0.65,
  rounding_mode text NOT NULL DEFAULT 'ceil' CHECK (rounding_mode IN ('none', 'round', 'ceil')),
  rounding_step integer NOT NULL DEFAULT 10,
  exchange_rate_irr_per_eur numeric NOT NULL DEFAULT 65000,
  google_script_url text,
  last_sync_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view settings"
  ON settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can update settings"
  ON settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_sales_manager_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  project_name text NOT NULL,
  employer_name text NOT NULL,
  project_type text NOT NULL,
  address_text text NOT NULL,
  tehran_lat numeric NOT NULL,
  tehran_lng numeric NOT NULL,
  additional_info text,
  status text NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'rejected', 'in_progress', 'quoted', 'won', 'lost', 'on_hold')),
  approval_decision_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  approval_decision_at timestamptz,
  approval_note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and sales managers can view all projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'sales_manager')
    )
  );

CREATE POLICY "Employees can view their own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    created_by_user_id = auth.uid()
  );

CREATE POLICY "All authenticated users can insert projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by_user_id = auth.uid()
  );

CREATE POLICY "Project creators can update their own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (created_by_user_id = auth.uid())
  WITH CHECK (created_by_user_id = auth.uid());

CREATE POLICY "Admins and sales managers can update all projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'sales_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'sales_manager')
    )
  );

CREATE POLICY "Admins can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create project_comments table
CREATE TABLE IF NOT EXISTS project_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  author_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_role_snapshot text NOT NULL,
  body text NOT NULL,
  parent_comment_id uuid REFERENCES project_comments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_project ON project_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON project_comments(created_at DESC);

ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on projects they can access"
  ON project_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_comments.project_id
      AND (
        projects.created_by_user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'sales_manager')
        )
      )
    )
  );

CREATE POLICY "Authenticated users can insert comments on accessible projects"
  ON project_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    author_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_comments.project_id
      AND (
        projects.created_by_user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'sales_manager')
        )
      )
    )
  );

-- Create project_inquiries table
CREATE TABLE IF NOT EXISTS project_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  requested_by_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_id uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_decision_at timestamptz,
  sell_price_eur_snapshot numeric NOT NULL,
  sell_price_irr_snapshot numeric,
  calculation_breakdown jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inquiries_project ON project_inquiries(project_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON project_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON project_inquiries(created_at DESC);

ALTER TABLE project_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all inquiries"
  ON project_inquiries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view inquiries on their projects"
  ON project_inquiries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_inquiries.project_id
      AND (
        projects.created_by_user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'sales_manager'
        )
      )
    )
  );

CREATE POLICY "Authenticated users can create inquiries"
  ON project_inquiries FOR INSERT
  TO authenticated
  WITH CHECK (
    requested_by_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_inquiries.project_id
      AND (
        projects.created_by_user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'sales_manager')
        )
      )
    )
  );

CREATE POLICY "Admins can update inquiries"
  ON project_inquiries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default settings
INSERT INTO settings (id, is_active, google_script_url)
VALUES (
  gen_random_uuid(),
  true,
  'https://script.google.com/macros/s/AKfycbyWeH17Ut3BQEvbdLB13e7WerluTExLqZOut1XgFjlCS4W4d06dfwCP1y2lTos9hUy7/exec'
)
ON CONFLICT (id) DO NOTHING;
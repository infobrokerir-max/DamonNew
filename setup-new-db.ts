import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabase = createClient(
  'https://zdskecucrvouimzbkbtq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpkc2tlY3VjcnZvdWltemJrYnRxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjYwMzk3OSwiZXhwIjoyMDgyMTc5OTc5fQ.ix8QMt0xkbyjqydcyrEuIrBy2abyMmErja3Tw41pfM8'
);

async function runSQL(sql: string) {
  const { data, error } = await supabase.rpc('exec', { query: sql });
  return { data, error };
}

async function setupDatabase() {
  console.log('Setting up new database...\n');

  const statements = [
    `CREATE TABLE IF NOT EXISTS profiles (
      id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      full_name text NOT NULL,
      username text UNIQUE NOT NULL,
      role text NOT NULL CHECK (role IN ('admin', 'sales_manager', 'employee')),
      is_active boolean DEFAULT true,
      created_at timestamptz DEFAULT now()
    );`,
    `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;`,
    
    `CREATE TABLE IF NOT EXISTS categories (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      category_name text NOT NULL,
      description text,
      created_at timestamptz DEFAULT now()
    );`,
    `ALTER TABLE categories ENABLE ROW LEVEL SECURITY;`,
    
    `CREATE TABLE IF NOT EXISTS devices (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      model_name text NOT NULL,
      category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      factory_pricelist_eur numeric NOT NULL,
      length_meter numeric NOT NULL,
      weight_unit numeric NOT NULL,
      is_active boolean DEFAULT true,
      created_at timestamptz DEFAULT now()
    );`,
    `CREATE INDEX IF NOT EXISTS idx_devices_category ON devices(category_id);`,
    `CREATE INDEX IF NOT EXISTS idx_devices_active ON devices(is_active);`,
    `ALTER TABLE devices ENABLE ROW LEVEL SECURITY;`,
    
    `CREATE TABLE IF NOT EXISTS settings (
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
    );`,
    `ALTER TABLE settings ENABLE ROW LEVEL SECURITY;`,
    
    `CREATE TABLE IF NOT EXISTS projects (
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
    );`,
    `CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by_user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);`,
    `CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);`,
    `ALTER TABLE projects ENABLE ROW LEVEL SECURITY;`,
    
    `CREATE TABLE IF NOT EXISTS project_comments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      author_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      author_role_snapshot text NOT NULL,
      body text NOT NULL,
      parent_comment_id uuid REFERENCES project_comments(id) ON DELETE CASCADE,
      created_at timestamptz DEFAULT now()
    );`,
    `CREATE INDEX IF NOT EXISTS idx_comments_project ON project_comments(project_id);`,
    `CREATE INDEX IF NOT EXISTS idx_comments_created_at ON project_comments(created_at DESC);`,
    `ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;`,
    
    `CREATE TABLE IF NOT EXISTS project_inquiries (
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
    );`,
    `CREATE INDEX IF NOT EXISTS idx_inquiries_project ON project_inquiries(project_id);`,
    `CREATE INDEX IF NOT EXISTS idx_inquiries_status ON project_inquiries(status);`,
    `CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON project_inquiries(created_at DESC);`,
    `ALTER TABLE project_inquiries ENABLE ROW LEVEL SECURITY;`
  ];

  console.log('Creating tables...');
  for (const stmt of statements) {
    try {
      await supabase.rpc('exec', { query: stmt });
    } catch (e) {
      // Ignore errors, continue
    }
  }
  console.log('✓ Tables created\n');

  console.log('Creating helper function...');
  await supabase.rpc('exec', { 
    query: `CREATE OR REPLACE FUNCTION get_current_user_role()
      RETURNS text
      LANGUAGE sql
      STABLE
      SECURITY DEFINER
      AS $$
        SELECT role FROM profiles WHERE id = auth.uid();
      $$;`
  });
  console.log('✓ Helper function created\n');

  console.log('Creating RLS policies...');
  const policies = [
    `CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT TO authenticated USING (true);`,
    `CREATE POLICY "Admins can insert profiles" ON profiles FOR INSERT TO authenticated WITH CHECK (get_current_user_role() = 'admin');`,
    `CREATE POLICY "Admins can update profiles" ON profiles FOR UPDATE TO authenticated USING (get_current_user_role() = 'admin') WITH CHECK (get_current_user_role() = 'admin');`,
    `CREATE POLICY "Admins can delete profiles" ON profiles FOR DELETE TO authenticated USING (get_current_user_role() = 'admin' AND id != auth.uid());`,
    
    `CREATE POLICY "All authenticated users can view categories" ON categories FOR SELECT TO authenticated USING (true);`,
    `CREATE POLICY "Admins can insert categories" ON categories FOR INSERT TO authenticated WITH CHECK (get_current_user_role() = 'admin');`,
    `CREATE POLICY "Admins can update categories" ON categories FOR UPDATE TO authenticated USING (get_current_user_role() = 'admin') WITH CHECK (get_current_user_role() = 'admin');`,
    `CREATE POLICY "Admins can delete categories" ON categories FOR DELETE TO authenticated USING (get_current_user_role() = 'admin');`,
    
    `CREATE POLICY "All authenticated users can view devices" ON devices FOR SELECT TO authenticated USING (true);`,
    `CREATE POLICY "Admins can insert devices" ON devices FOR INSERT TO authenticated WITH CHECK (get_current_user_role() = 'admin');`,
    `CREATE POLICY "Admins can update devices" ON devices FOR UPDATE TO authenticated USING (get_current_user_role() = 'admin') WITH CHECK (get_current_user_role() = 'admin');`,
    `CREATE POLICY "Admins can delete devices" ON devices FOR DELETE TO authenticated USING (get_current_user_role() = 'admin');`,
    
    `CREATE POLICY "All authenticated users can view settings" ON settings FOR SELECT TO authenticated USING (true);`,
    `CREATE POLICY "Admins can update settings" ON settings FOR UPDATE TO authenticated USING (get_current_user_role() = 'admin') WITH CHECK (get_current_user_role() = 'admin');`,
    
    `CREATE POLICY "Admins and sales managers can view all projects" ON projects FOR SELECT TO authenticated USING (get_current_user_role() IN ('admin', 'sales_manager'));`,
    `CREATE POLICY "Employees can view their own projects" ON projects FOR SELECT TO authenticated USING (created_by_user_id = auth.uid());`,
    `CREATE POLICY "All authenticated users can insert projects" ON projects FOR INSERT TO authenticated WITH CHECK (created_by_user_id = auth.uid());`,
    `CREATE POLICY "Project creators can update their own projects" ON projects FOR UPDATE TO authenticated USING (created_by_user_id = auth.uid()) WITH CHECK (created_by_user_id = auth.uid());`,
    `CREATE POLICY "Admins and sales managers can update all projects" ON projects FOR UPDATE TO authenticated USING (get_current_user_role() IN ('admin', 'sales_manager')) WITH CHECK (get_current_user_role() IN ('admin', 'sales_manager'));`,
    `CREATE POLICY "Admins can delete projects" ON projects FOR DELETE TO authenticated USING (get_current_user_role() = 'admin');`,
    
    `CREATE POLICY "Users can view comments on projects they can access" ON project_comments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_comments.project_id AND (projects.created_by_user_id = auth.uid() OR get_current_user_role() IN ('admin', 'sales_manager'))));`,
    `CREATE POLICY "Authenticated users can insert comments on accessible projects" ON project_comments FOR INSERT TO authenticated WITH CHECK (author_user_id = auth.uid() AND EXISTS (SELECT 1 FROM projects WHERE projects.id = project_comments.project_id AND (projects.created_by_user_id = auth.uid() OR get_current_user_role() IN ('admin', 'sales_manager'))));`,
    
    `CREATE POLICY "Admins can view all inquiries" ON project_inquiries FOR SELECT TO authenticated USING (get_current_user_role() = 'admin');`,
    `CREATE POLICY "Users can view inquiries on their projects" ON project_inquiries FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_inquiries.project_id AND projects.created_by_user_id = auth.uid()));`,
    `CREATE POLICY "Authenticated users can create inquiries" ON project_inquiries FOR INSERT TO authenticated WITH CHECK (requested_by_user_id = auth.uid());`,
    `CREATE POLICY "Admins can update inquiries" ON project_inquiries FOR UPDATE TO authenticated USING (get_current_user_role() = 'admin') WITH CHECK (get_current_user_role() = 'admin');`
  ];

  for (const policy of policies) {
    try {
      await supabase.rpc('exec', { query: policy });
    } catch (e) {
      // Ignore policy errors (already exist)
    }
  }
  console.log('✓ RLS policies created\n');

  console.log('Seeding data...');
  await supabase.from('categories').upsert([
    { id: 'c1111111-1111-1111-1111-111111111111', category_name: 'چیلر تراکمی', description: 'سیستم های تراکمی سرمایشی' },
    { id: 'c2222222-2222-2222-2222-222222222222', category_name: 'VRF', description: 'سیستم های جریان متغیر سردکننده' },
    { id: 'c3333333-3333-3333-3333-333333333333', category_name: 'هواساز', description: 'سیستم های هواساز و کویل دار' }
  ], { onConflict: 'id' });

  await supabase.from('devices').upsert([
    { id: 'd1111111-1111-1111-1111-111111111111', model_name: 'CH-2000-X', category_id: 'c1111111-1111-1111-1111-111111111111', factory_pricelist_eur: 50000, length_meter: 4.5, weight_unit: 2000, is_active: true },
    { id: 'd2222222-2222-2222-2222-222222222222', model_name: 'CH-4000-Pro', category_id: 'c1111111-1111-1111-1111-111111111111', factory_pricelist_eur: 85000, length_meter: 6.2, weight_unit: 3500, is_active: true },
    { id: 'd3333333-3333-3333-3333-333333333333', model_name: 'VRF-Outdoor-12HP', category_id: 'c2222222-2222-2222-2222-222222222222', factory_pricelist_eur: 12000, length_meter: 1.2, weight_unit: 400, is_active: true },
    { id: 'd4444444-4444-4444-4444-444444444444', model_name: 'VRF-Indoor-Cassette', category_id: 'c2222222-2222-2222-2222-222222222222', factory_pricelist_eur: 800, length_meter: 0.8, weight_unit: 40, is_active: true },
    { id: 'd5555555-5555-5555-5555-555555555555', model_name: 'AHU-10000-CFM', category_id: 'c3333333-3333-3333-3333-333333333333', factory_pricelist_eur: 15000, length_meter: 3.0, weight_unit: 1200, is_active: true },
    { id: 'd6666666-6666-6666-6666-666666666666', model_name: 'AHU-25000-CFM', category_id: 'c3333333-3333-3333-3333-333333333333', factory_pricelist_eur: 28000, length_meter: 5.5, weight_unit: 2100, is_active: true }
  ], { onConflict: 'id' });

  const { data: existingSettings } = await supabase.from('settings').select('id').limit(1).single();
  if (!existingSettings) {
    await supabase.from('settings').insert({
      is_active: true,
      google_script_url: 'https://script.google.com/macros/s/AKfycbyWeH17Ut3BQEvbdLB13e7WerluTExLqZOut1XgFjlCS4W4d06dfwCP1y2lTos9hUy7/exec'
    });
  }
  console.log('✓ Data seeded\n');

  console.log('Creating initial users...');
  await supabase.auth.admin.createUser({
    email: 'admin@damon.local',
    password: 'sasan',
    email_confirm: true
  }).then(async ({ data, error }) => {
    if (data?.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        username: 'admin',
        full_name: 'مدیر سیستم',
        role: 'admin',
        is_active: true
      });
      console.log('✓ Admin user created');
    }
  }).catch(() => console.log('Admin user already exists'));

  console.log('\n✓ Database setup complete!\n');
  console.log('=================================');
  console.log('Username: admin');
  console.log('Password: sasan');
  console.log('=================================\n');
}

setupDatabase().catch(console.error);

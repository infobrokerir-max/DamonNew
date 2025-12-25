import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabase = createClient(
  'https://hwtjybqujyeisdzxqkzh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3dGp5YnF1anllaXNkenhxa3poIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU4NzY2MSwiZXhwIjoyMDgyMTYzNjYxfQ.VOmS-X8nKnzvbrYOGjHQiH6b7bD-z-uX1G6djoTPX1Y'
);

async function applyMigrations() {
  const migrations = [
    './supabase/migrations/20251224232045_create_initial_schema.sql',
    './supabase/migrations/20251224232306_seed_initial_data.sql',
    './supabase/migrations/20251225000228_fix_rls_policies_use_profiles_role.sql'
  ];

  for (const file of migrations) {
    console.log(`\nApplying ${file}...`);
    const sql = readFileSync(file, 'utf-8');
    
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('✓ Applied successfully');
    }
  }

  console.log('\n✓ All migrations applied');

  console.log('\nSetting up admin user...');
  const { data: users } = await supabase.auth.admin.listUsers();
  const adminUser = users?.users.find(u => u.email === 'thecompany.sasan@gmail.com');

  if (adminUser) {
    await supabase.from('profiles').upsert({
      id: adminUser.id,
      username: 'admin',
      full_name: 'مدیر سیستم',
      role: 'admin',
      is_active: true,
    });

    await supabase.auth.admin.updateUserById(adminUser.id, { password: 'sasan123' });

    console.log('✓ Admin setup complete!');
    console.log('\n=================================');
    console.log('Username: admin');
    console.log('Password: sasan123');
    console.log('=================================\n');
  }
}

applyMigrations();

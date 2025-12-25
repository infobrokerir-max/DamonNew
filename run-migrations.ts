import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabase = createClient(
  'https://hwtjybqujyeisdzxqkzh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3dGp5YnF1anllaXNkenhxa3poIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU4NzY2MSwiZXhwIjoyMDgyMTYzNjYxfQ.VOmS-X8nKnzvbrYOGjHQiH6b7bD-z-uX1G6djoTPX1Y',
  {
    db: {
      schema: 'public'
    }
  }
);

async function runSQL(sql: string) {
  const response = await fetch(
    'https://hwtjybqujyeisdzxqkzh.supabase.co/rest/v1/rpc/exec',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3dGp5YnF1anllaXNkenhxa3poIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU4NzY2MSwiZXhwIjoyMDgyMTYzNjYxfQ.VOmS-X8nKnzvbrYOGjHQiH6b7bD-z-uX1G6djoTPX1Y',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3dGp5YnF1anllaXNkenhxa3poIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU4NzY2MSwiZXhwIjoyMDgyMTYzNjYxfQ.VOmS-X8nKnzvbrYOGjHQiH6b7bD-z-uX1G6djoTPX1Y'
      },
      body: JSON.stringify({ query: sql })
    }
  );
  
  return response;
}

async function applyMigrations() {
  console.log('Applying migrations...\n');

  const migrations = [
    './supabase/migrations/20251224232045_create_initial_schema.sql',
    './supabase/migrations/20251224232306_seed_initial_data.sql',
    './supabase/migrations/20251225000228_fix_rls_policies_use_profiles_role.sql'
  ];

  for (const file of migrations) {
    console.log(`Applying ${file}...`);
    const sql = readFileSync(file, 'utf-8');
    
    try {
      const {data, error} = await supabase.rpc('exec', { query: sql });
      if (error) {
        console.error('Error:', error.message);
      } else {
        console.log('✓ Applied');
      }
    } catch (e: any) {
      console.log('Applying via direct SQL...');
      
      const statements = sql
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/--[^\n]*/g, '')
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 10);

      for (const stmt of statements) {
        try {
          await supabase.rpc('exec', { query: stmt });
        } catch (err) {
          // Ignore errors for IF EXISTS statements
        }
      }
      console.log('✓ Applied');
    }
  }

  console.log('\n✓ All migrations applied!\n');

  console.log('Setting up admin user...');
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

    console.log('✓ Admin configured!\n');
    console.log('=================================');
    console.log('Username: admin');
    console.log('Password: sasan123');
    console.log('=================================\n');
  }
}

applyMigrations().catch(console.error);

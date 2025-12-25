import { Client } from 'pg';
import { readFileSync } from 'fs';

const client = new Client({
  connectionString: 'postgres://postgres.hwtjybqujyeisdzxqkzh:Allahverdi7665@aws-0-eu-central-1.pooler.supabase.com:5432/postgres'
});

async function runMigrations() {
  await client.connect();
  console.log('Connected to database\n');

  const migrations = [
    './supabase/migrations/20251224232045_create_initial_schema.sql',
    './supabase/migrations/20251224232306_seed_initial_data.sql',
    './supabase/migrations/20251225000228_fix_rls_policies_use_profiles_role.sql'
  ];

  for (const file of migrations) {
    console.log(`Applying ${file}...`);
    const sql = readFileSync(file, 'utf-8');
    
    try {
      await client.query(sql);
      console.log('✓ Applied successfully\n');
    } catch (error: any) {
      console.error('Error:', error.message);
      console.log('');
    }
  }

  await client.end();
  console.log('✓ All migrations applied!\n');
}

runMigrations().catch(console.error);

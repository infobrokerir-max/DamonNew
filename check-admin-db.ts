import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zdskecucrvouimzbkbtq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpkc2tlY3VjcnZvdWltemJrYnRxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjYwMzk3OSwiZXhwIjoyMDgyMTc5OTc5fQ.ix8QMt0xkbyjqydcyrEuIrBy2abyMmErja3Tw41pfM8',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function verify() {
  console.log('Database Status (Service Role):\n');

  const { data: categories, error: catErr } = await supabase.from('categories').select('*');
  console.log('Categories:', categories?.length || 0);
  if (catErr) console.log('  Error:', catErr.message);

  const { data: devices, error: devErr } = await supabase.from('devices').select('*');
  console.log('Devices:', devices?.length || 0);
  if (devErr) console.log('  Error:', devErr.message);

  const { data: settings, error: setErr } = await supabase.from('settings').select('*');
  console.log('Settings:', settings?.length || 0);
  if (setErr) console.log('  Error:', setErr.message);

  const { data: profiles, error: profErr } = await supabase.from('profiles').select('username, role');
  console.log('Users:', profiles?.length || 0);
  if (profErr) console.log('  Error:', profErr.message);

  if (profiles && profiles.length > 0) {
    console.log('\nAccounts:');
    profiles.forEach((p: any) => {
      console.log('  -', p.username, '(' + p.role + ')');
    });
  }

  const { data: authUsers } = await supabase.auth.admin.listUsers();
  console.log('\nAuth users:', authUsers?.users.length || 0);
  if (authUsers?.users) {
    authUsers.users.forEach((u: any) => {
      console.log('  -', u.email);
    });
  }

  console.log('\n=================================');
  console.log('Username: admin');
  console.log('Password: sasan');
  console.log('=================================');
}

verify();

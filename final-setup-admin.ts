import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hwtjybqujyeisdzxqkzh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3dGp5YnF1anllaXNkenhxa3poIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU4NzY2MSwiZXhwIjoyMDgyMTYzNjYxfQ.VOmS-X8nKnzvbrYOGjHQiH6b7bD-z-uX1G6djoTPX1Y',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createAdminUser() {
  console.log('Checking for existing admin@damon.local user...');

  const { data: users } = await supabase.auth.admin.listUsers();
  const existingAdmin = users?.users.find(u => u.email === 'admin@damon.local');

  if (existingAdmin) {
    console.log('Admin user already exists, deleting first...');
    await supabase.from('profiles').delete().eq('id', existingAdmin.id);
    await supabase.auth.admin.deleteUser(existingAdmin.id);
  }

  console.log('Creating new admin user...');

  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email: 'admin@damon.local',
    password: 'sasan123',
    email_confirm: true,
  });

  if (createError) {
    console.error('Error creating user:', createError);
    return;
  }

  console.log('✓ Auth user created:', newUser.user.id);

  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: newUser.user.id,
      username: 'admin',
      full_name: 'مدیر سیستم',
      role: 'admin',
      is_active: true,
    });

  if (profileError) {
    console.error('Error creating profile:', profileError);
    return;
  }

  console.log('✓ Profile created successfully!');
  console.log('\n=================================');
  console.log('Login credentials:');
  console.log('Username: admin');
  console.log('Password: sasan123');
  console.log('=================================\n');
}

createAdminUser();

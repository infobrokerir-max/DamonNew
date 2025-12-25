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

async function createAdmin() {
  console.log('Creating admin user...');

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'admin@damon.local',
    password: 'sasan123',
    email_confirm: true,
    user_metadata: {}
  });

  if (authError) {
    console.error('Error creating auth user:', authError);
    return;
  }

  console.log('✓ Auth user created:', authData.user.id);

  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
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
  console.log('\nLogin credentials:');
  console.log('Username: admin');
  console.log('Password: sasan123');
}

createAdmin();

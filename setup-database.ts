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

async function setup() {
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }

  console.log('Found auth users:', users.users.map(u => u.email));

  const sasanUser = users.users.find(u => u.email === 'thecompany.sasan@gmail.com' || u.email === 'sasan.hatam@gmail.com');

  if (sasanUser) {
    console.log(`\nUpdating ${sasanUser.email} to have username 'admin'...`);

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: sasanUser.id,
        username: 'admin',
        full_name: 'مدیر سیستم',
        role: 'admin',
        is_active: true,
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      return;
    }

    const { data, error } = await supabase.auth.admin.updateUserById(
      sasanUser.id,
      { password: 'sasan123' }
    );

    if (error) {
      console.error('Error setting password:', error);
      return;
    }

    console.log('✓ Setup complete!');
    console.log('\nLogin credentials:');
    console.log('Username: admin');
    console.log('Password: sasan123');
  }
}

setup();

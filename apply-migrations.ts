import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hwtjybqujyeisdzxqkzh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3dGp5YnF1anllaXNkenhxa3poIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU4NzY2MSwiZXhwIjoyMDgyMTYzNjYxfQ.VOmS-X8nKnzvbrYOGjHQiH6b7bD-z-uX1G6djoTPX1Y'
);

async function setup() {
  console.log('Setting up admin user profile...');

  const { data: users } = await supabase.auth.admin.listUsers();
  const adminUser = users?.users.find(u => u.email === 'thecompany.sasan@gmail.com');

  if (adminUser) {
    await supabase.from('profiles').upsert({
      id: adminUser.id,
      username: 'admin',
      full_name: 'مدیر سیستم',
      role: 'admin',
      is_active: true,
    }, { onConflict: 'id' });

    await supabase.auth.admin.updateUserById(adminUser.id, { password: 'sasan123' });

    console.log('✓ Admin setup complete!');
    console.log('\nLogin: admin / sasan123');
  }
}

setup();

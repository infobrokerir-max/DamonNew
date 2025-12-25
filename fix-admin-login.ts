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

async function fixLogin() {
  const { data: profiles } = await supabase.from('profiles').select('*');
  console.log('Existing profiles:', profiles);

  const { data: users } = await supabase.auth.admin.listUsers();
  console.log('\nAuth users:');
  users?.users.forEach(u => console.log(`- ${u.email} (${u.id})`));

  const adminProfile = profiles?.find(p => p.username === 'admin');
  if (adminProfile) {
    console.log('\nAdmin profile exists for user:', adminProfile.id);
    const user = users?.users.find(u => u.id === adminProfile.id);
    if (user) {
      console.log('Email:', user.email);
      console.log('\nSetting password...');
      const { error } = await supabase.auth.admin.updateUserById(adminProfile.id, { password: 'sasan123' });
      if (error) {
        console.error('Error:', error);
      } else {
        console.log('✓ Password updated!');
        console.log('\n=================================');
        console.log('Username: admin');
        console.log('Password: sasan123');
        console.log('=================================\n');
      }
    }
  }
}

fixLogin();

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

async function reset() {
  console.log('Listing all users first...');
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }

  console.log('Users found:', users.users.length);
  users.users.forEach(u => {
    console.log(`- ${u.email} (${u.id})`);
  });

  const adminUser = users.users.find(u => u.email === 'admin@damon.local');

  if (!adminUser) {
    console.log('Admin user not found!');
    return;
  }

  console.log(`\nResetting password for ${adminUser.email} (${adminUser.id})...`);

  const { data, error } = await supabase.auth.admin.updateUserById(
    adminUser.id,
    { password: 'sasan123' }
  );

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('✓ Password reset successful!');
  console.log('Username: admin');
  console.log('Password: sasan123');
}

reset();

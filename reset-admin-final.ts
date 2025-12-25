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

async function resetAdminPassword() {
  console.log('Resetting admin password...');

  const { data, error } = await supabase.auth.admin.updateUserById(
    '77bdc6ca-4cc7-495d-9696-52543b5e57a9',
    { password: 'sasan123' }
  );

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('✓ Password reset successful!');
  console.log('\n=================================');
  console.log('Login credentials:');
  console.log('Username: admin');
  console.log('Password: sasan123');
  console.log('=================================\n');
}

resetAdminPassword();

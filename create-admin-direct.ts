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

async function setupAdmin() {
  console.log('Creating admin profile...');

  const adminId = 'b4ce3e53-25bc-4f1f-a8c3-df33fc13a975';

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: adminId,
      username: 'admin',
      full_name: 'مدیر سیستم',
      role: 'admin',
      is_active: true,
    }, { onConflict: 'id' });

  if (profileError) {
    console.error('Profile error:', profileError);
  } else {
    console.log('✓ Profile created');
  }

  const { error: passwordError } = await supabase.auth.admin.updateUserById(
    adminId,
    { password: 'sasan123' }
  );

  if (passwordError) {
    console.error('Password error:', passwordError);
  } else {
    console.log('✓ Password set');
  }

  console.log('\n=================================');
  console.log('Username: admin');
  console.log('Password: sasan123');
  console.log('=================================\n');
}

setupAdmin();

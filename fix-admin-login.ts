import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SB_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SB_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SB_URL or SB_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixAdminLogin() {
  console.log('Resetting admin password...');

  const { data: user, error: updateError } = await supabase.auth.admin.updateUserById(
    '77bdc6ca-4cc7-495d-9696-52543b5e57a9',
    { password: 'sasan123' }
  );

  if (updateError) {
    console.error('Error updating password:', updateError);
    process.exit(1);
  }

  console.log('✓ Admin password has been reset to: sasan123');
  console.log('✓ You can now login with:');
  console.log('  Username: admin');
  console.log('  Password: sasan123');
}

fixAdminLogin();

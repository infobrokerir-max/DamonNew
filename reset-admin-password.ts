import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const envVars: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Found' : 'Missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Found' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetAdminPassword() {
  console.log('Resetting admin password...');

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', 'admin')
      .single();

    if (!profile) {
      console.error('Admin profile not found');
      return;
    }

    const { data, error } = await supabase.auth.admin.updateUserById(
      profile.id,
      { password: 'sasan123' }
    );

    if (error) {
      console.error('Error updating password:', error.message);
    } else {
      console.log('✓ Admin password updated successfully!');
      console.log('  Username: admin');
      console.log('  Password: sasan123');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

resetAdminPassword();

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
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing environment variables in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdmin() {
  console.log('Creating admin user...');

  try {
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: 'admin@damon.local',
      password: 'sasan123',
      options: {
        data: {
          username: 'admin',
          full_name: 'مدیر سیستم',
          role: 'admin'
        }
      }
    });

    if (signUpError) {
      console.error('Error during signup:', signUpError.message);
      return;
    }

    if (!authData.user) {
      console.error('No user created');
      return;
    }

    console.log('Auth user created:', authData.user.id);

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
      console.error('Error creating profile:', profileError.message);
      return;
    }

    console.log('✓ Admin user created successfully!');
    console.log('  Username: admin');
    console.log('  Password: sasan123');
    console.log('  Email: admin@damon.local');

  } catch (error) {
    console.error('Error:', error);
  }
}

createAdmin();

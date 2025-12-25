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

async function createAdminViaAPI() {
  console.log('Creating admin user via Management API...');

  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not found in environment');
      console.error('Please set this environment variable to create admin users');
      return;
    }

    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
      },
      body: JSON.stringify({
        email: 'admin@damon.local',
        password: 'sasan123',
        email_confirm: true,
        user_metadata: {
          username: 'admin',
          full_name: 'مدیر سیستم',
          role: 'admin'
        }
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Error creating user:', result);
      return;
    }

    console.log('✓ Admin user created successfully!');
    console.log('  User ID:', result.id);
    console.log('  Username: admin');
    console.log('  Password: sasan123');
    console.log('  Email: admin@damon.local');

  } catch (error) {
    console.error('Error:', error);
  }
}

createAdminViaAPI();

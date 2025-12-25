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
  console.error('Missing environment variables in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const users = [
  { username: 'admin', password: 'sasan', full_name: 'مدیر سیستم', role: 'admin' },
  { username: 'sales', password: '123', full_name: 'مدیر فروش', role: 'sales_manager' },
  { username: 'emp1', password: '123', full_name: 'کارمند یک', role: 'employee' },
  { username: 'emp2', password: '123', full_name: 'کارمند دو', role: 'employee' },
];

async function seedUsers() {
  console.log('Starting user seed...');

  for (const user of users) {
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: `${user.username}@damon.local`,
        password: user.password,
        email_confirm: true,
      });

      if (authError) {
        console.error(`Error creating auth user ${user.username}:`, authError.message);
        continue;
      }

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            username: user.username,
            full_name: user.full_name,
            role: user.role,
            is_active: true,
          });

        if (profileError) {
          console.error(`Error creating profile for ${user.username}:`, profileError.message);
        } else {
          console.log(`✓ Created user: ${user.username} (${user.role})`);
        }
      }
    } catch (error) {
      console.error(`Error seeding user ${user.username}:`, error);
    }
  }

  console.log('User seed completed!');
}

seedUsers();

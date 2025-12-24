import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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

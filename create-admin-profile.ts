import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zdskecucrvouimzbkbtq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpkc2tlY3VjcnZvdWltemJrYnRxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjYwMzk3OSwiZXhwIjoyMDgyMTc5OTc5fQ.ix8QMt0xkbyjqydcyrEuIrBy2abyMmErja3Tw41pfM8',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createProfile() {
  console.log('Finding admin user...');
  
  const { data: users } = await supabase.auth.admin.listUsers();
  const adminUser = users?.users.find(u => u.email === 'admin@damon.local');

  if (!adminUser) {
    console.log('Admin user not found. Creating...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: 'admin@damon.local',
      password: 'sasan',
      email_confirm: true
    });

    if (createError) {
      console.error('Error creating user:', createError.message);
      return;
    }

    if (newUser?.user) {
      console.log('Admin user created:', newUser.user.id);
      
      const { error: profileError } = await supabase.from('profiles').insert({
        id: newUser.user.id,
        username: 'admin',
        full_name: 'مدیر سیستم',
        role: 'admin',
        is_active: true
      });

      if (profileError) {
        console.error('Error creating profile:', profileError.message);
      } else {
        console.log('✓ Admin profile created');
      }
    }
  } else {
    console.log('Admin user found:', adminUser.id);
    
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: adminUser.id,
      username: 'admin',
      full_name: 'مدیر سیستم',
      role: 'admin',
      is_active: true
    }, { onConflict: 'id' });

    if (profileError) {
      console.error('Error creating profile:', profileError.message);
    } else {
      console.log('✓ Admin profile created/updated');
    }
  }

  console.log('\n=================================');
  console.log('Username: admin');
  console.log('Password: sasan');
  console.log('=================================');
}

createProfile();

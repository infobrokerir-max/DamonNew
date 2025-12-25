import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zdskecucrvouimzbkbtq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpkc2tlY3VjcnZvdWltemJrYnRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MDM5NzksImV4cCI6MjA4MjE3OTk3OX0.7UgZEk2hctJ6Wxx2N2zbm1EKQPJqJeqcu3EttNY9mIY'
);

async function verify() {
  console.log('Database Status:\n');

  const { data: categories } = await supabase.from('categories').select('*');
  console.log('Categories:', categories?.length || 0);

  const { data: devices } = await supabase.from('devices').select('*');
  console.log('Devices:', devices?.length || 0);

  const { data: settings } = await supabase.from('settings').select('*');
  console.log('Settings:', settings?.length || 0);

  const { data: profiles } = await supabase.from('profiles').select('username, role');
  console.log('Users:', profiles?.length || 0);

  if (profiles && profiles.length > 0) {
    console.log('\nAccounts:');
    profiles.forEach((p: any) => {
      console.log('  -', p.username, '(' + p.role + ')');
    });
  }

  console.log('\nDatabase ready!');
}

verify();

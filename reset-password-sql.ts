import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hwtjybqujyeisdzxqkzh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3dGp5YnF1anllaXNkenhxa3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1ODc2NjEsImV4cCI6MjA4MjE2MzY2MX0.yZwPslLUwDlApUNa9m-Gp-vq5rlGH1AE4LJKn-7m5C0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  console.log('Testing login with admin credentials...');

  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@damon.local',
    password: 'sasan123',
  });

  if (error) {
    console.error('Login failed:', error.message);
    return;
  }

  console.log('✓ Login successful!');
  console.log('User:', data.user?.email);
}

testLogin();

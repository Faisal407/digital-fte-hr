const SUPABASE_URL = 'https://wtjupktgosmtizkxlita.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0anVwa3Rnb3NtdGl6a3hsaXRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2ODExMTIsImV4cCI6MjA4ODI1NzExMn0.nMvayaOgpMo-8tYmtJC8PqPNxNUbHw2SXoMp96pvSlA';
const EMAIL = 'syedfaisalhassan7@gmail.com';
const PASSWORD = 'admin@12345';

async function test() {
  console.log(`Testing Supabase connection...`);
  console.log(`URL: ${SUPABASE_URL}`);
  console.log(`Email: ${EMAIL}`);

  try {
    // Test: Try to sign in
    console.log(`\nAttempting to sign in...`);
    const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: EMAIL,
        password: PASSWORD
      })
    });

    const loginData = await loginRes.json();
    
    if (loginRes.ok && loginData.access_token) {
      console.log(`✓ Login successful!`);
      console.log(`  User ID: ${loginData.user?.id}`);
      console.log(`  Email: ${loginData.user?.email}`);
      console.log(`  Token: ${loginData.access_token.substring(0, 20)}...`);
    } else {
      console.log(`✗ Login failed`);
      console.log(`  Status: ${loginRes.status}`);
      console.log(`  Response:`, JSON.stringify(loginData, null, 2));
      
      if (loginData.error_description) {
        console.log(`  Error: ${loginData.error_description}`);
      }
    }

  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
}

test();

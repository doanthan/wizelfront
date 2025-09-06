import fetch from 'node-fetch';

async function testAPI() {
  try {
    // First, login to get a session
    console.log('🔐 Logging in...');
    
    const loginResponse = await fetch('http://localhost:3003/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'doanthan@gmail.com',
        password: '123123123',
        csrfToken: '', // NextAuth will handle this
        callbackUrl: '/dashboard',
        json: 'true',
      }),
      redirect: 'manual',
    });
    
    console.log('Login response status:', loginResponse.status);
    
    // Get the session cookie
    const cookies = loginResponse.headers.raw()['set-cookie'];
    console.log('Cookies received:', cookies?.length || 0);
    
    if (cookies) {
      // Extract session token
      const sessionCookie = cookies.find(c => c.includes('next-auth.session-token'));
      console.log('Session cookie found:', !!sessionCookie);
      
      // Test the store API
      console.log('\n📦 Testing /api/store...');
      
      const storeResponse = await fetch('http://localhost:3003/api/store', {
        headers: {
          'Cookie': cookies.join('; '),
        },
      });
      
      console.log('Store API status:', storeResponse.status);
      
      if (storeResponse.ok) {
        const data = await storeResponse.json();
        console.log('Stores returned:', data.stores?.length || 0);
        if (data.stores?.length > 0) {
          console.log('\nStores:');
          data.stores.forEach(store => {
            console.log(`  - ${store.name} (${store._id})`);
          });
        }
      } else {
        console.log('Store API error:', await storeResponse.text());
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

console.log('🧪 Testing API directly...\n');
testAPI();
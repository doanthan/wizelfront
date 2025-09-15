// Test script to check if stores API is working
const fetch = require('node-fetch');

async function testStoresAPI() {
  try {
    console.log('Testing /api/store endpoint...');
    
    // Get the session cookie from your browser (you'll need to be logged in)
    // You can find this in browser DevTools > Application > Cookies
    const sessionCookie = process.env.SESSION_COOKIE || '';
    
    const response = await fetch('http://localhost:3006/api/store', {
      headers: {
        'Cookie': sessionCookie
      }
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Stores data:', JSON.stringify(data, null, 2));
      console.log('Number of stores:', data.stores?.length || 0);
      
      if (data.stores && data.stores.length > 0) {
        console.log('\nFirst store:');
        console.log('- Name:', data.stores[0].name);
        console.log('- Public ID:', data.stores[0].public_id);
        console.log('- URL:', data.stores[0].url);
      }
    } else {
      console.log('Failed to fetch stores:', response.statusText);
      const text = await response.text();
      console.log('Response:', text);
    }
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

// Note: To test this properly, you need to:
// 1. Be logged in to the application in your browser
// 2. Get your session cookie from browser DevTools
// 3. Run: SESSION_COOKIE="your-cookie-here" node test-stores-api.js

console.log(`
To test the API:
1. Open http://localhost:3006 in your browser
2. Log in to the application
3. Open DevTools (F12)
4. Go to Application > Cookies
5. Copy the value of the session cookie (usually named something like "next-auth.session-token")
6. Run this script with: SESSION_COOKIE="your-cookie-value" node test-stores-api.js
`);

testStoresAPI();
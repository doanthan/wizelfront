import fetch from 'node-fetch';

async function testAPI() {
  try {
    // Test the store API
    const response = await fetch('http://localhost:3003/api/store', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('API Response Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Stores returned:', data.stores?.length || 0);
      
      if (data.stores && data.stores.length > 0) {
        console.log('\nStores from API:');
        data.stores.forEach(store => {
          console.log(`  - ${store.name} (${store._id})`);
        });
      }
    } else {
      console.log('API Error:', await response.text());
    }
  } catch (error) {
    console.error('Error calling API:', error);
  }
}

testAPI();
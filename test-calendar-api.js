async function testCalendarAPI() {
  try {
    // Test fetching all campaigns for current month
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
    
    console.log('Testing past campaigns API...');
    console.log('Date range:', startDate.toISOString(), 'to', endDate.toISOString());
    
    const response = await fetch(`http://localhost:3000/api/calendar/campaigns/past?${params}`);
    const data = await response.json();
    
    if (data.error) {
      console.log('Error:', data.error);
      console.log('Response status:', response.status);
    } else {
      console.log('Campaigns found:', data.total || data.campaigns?.length || 0);
      if (data.campaigns && data.campaigns.length > 0) {
        console.log('\nFirst 3 campaigns:');
        data.campaigns.slice(0, 3).forEach(c => {
          console.log(`  - ${c.name}`);
          console.log(`    Date: ${c.date}`);
          console.log(`    Channel: ${c.channel}`);
          console.log(`    Store: ${c.klaviyo_public_id}`);
        });
      }
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testCalendarAPI();
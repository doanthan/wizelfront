// Test script for scheduled campaigns API
const testScheduledCampaigns = async () => {
  try {
    console.log('Testing scheduled campaigns API...');
    
    // Test the calendar campaigns endpoint with date range
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 2); // Next 2 months
    
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
    
    const response = await fetch(`http://localhost:3001/api/calendar/campaigns?${params}`, {
      headers: {
        'Cookie': 'next-auth.session-token=test' // You'll need to get real session
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:', {
        totalCampaigns: data.total,
        historicalCount: data.historical,
        scheduledCount: data.scheduled,
        sampleCampaigns: data.campaigns?.slice(0, 3)
      });
    } else {
      console.log('❌ API Error:', response.status, await response.text());
    }
  } catch (error) {
    console.log('❌ Test Error:', error.message);
  }
};

testScheduledCampaigns();
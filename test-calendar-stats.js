// Test script to check calendar stats
async function testCalendarStats() {
  const sessionToken = 'eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..WBiVHOOEc7LP04h3.eu4hLLukOPRcIpH3T6RhffJd6-3viIB9paxnyTvYY0IbJNS3iGay87irdrcSdFF6Pz_KoajfpXCsHhdo0wXP13_Q6XYu0ytNrvbqhquIL9gYkqHoK3SW8Drs2r0ZqvgLlrmuTxJrd09YqSTD8fw6pUVxCJqyMO_p9uaBLB79PH563PNUmY4mYNj-_1npG286EyyArViG0KT0dYwYLtzxwVSTH55fruMVbvsZ-9CB2EXHwLhWWvynLqFe5KS0mHpWFsKLM-dooFmyEtOCjkGsQdC-3_sNbaUXaAFbLxHMfTZrGUFaH0TKInMIjpNJQR9X2V64bORR0txEYNbxkHb7HLqKWSYNhZqVcnKm_qo65sSbBWaeHJ3XAv7AOZFjkRGfPE2Yw6fFyTngRatpr-S_15X0gvQMD-kK4KarmHlGs-g4QtclYyMoaJjJZmuzaj15eSgaMXe7pq9qtLDPlj2VQVHCOEh0QMAplSkWyhpelTBR0mQmGwXQrNWzmmm5OIyqWlPJyyFMsHsD0rFf7KluYXYPuWw_dMMHqrbjenNGspcTl51K-R4Sm8EP0w3ZArYYKVdnz66tDnzVRE3qTk3wXdm7NAIuvU0Ga8-zkWD6WwdaTuQ1YNRn4OS-6uNmME6pL6sr8_lkaZi6HbNcOiwg637qCdBXPYPcj_qw70U1FVCAi0VfJACUyCB9oXmSKf64WKK-avGhuD0ujnP584W_kewOkJje01wIFAuzbpY7N0bW_K9rMiWrKNOy8vrHZzoic-M4b6-JvJzQr-BNo7mFHCgs2tyxAGLAPM6VQTUl5RSrjCu8QfXVizbhZ7vabKOCsgZK4ZBn8MCwnjMEyz9RemeSZl6rtIzH_K5bMTEuDktRBPzks6SOua1aGIhogEV6dhJ96ro1LAL_Wa37L6Zyt320zMu3t4u2O28YAYuH7cUGjQoOelKNC7rwJmjL73xyceXgB85vl0NgPrePFRfarg_yabTSbPdNMITOiLNK4bpQnI8kio8iTuTiVD4JhcsVcIzqYGMNxIWgAhRQ8uO4upx_UQ2eddtf3q_TYLDhVNhAuW2BK_6MRdP-JFH1K9NNc6DIltWr9cjQ39WMKxI3ai1-0Eh0U_OQtmUPtB9S8ih_omKB52RCbnxSgHeJ6jMFna6UAamyvghe0Xko7xL4JA-Jy3KwljngSNyFNvGQW1kw-wRx_WF50BSdLJJxmhgpVk9QzPoD4YeAmLtQP3S7oW6DZe1H_aujefsiAhFxv8QoHt9M7YBylhFOmzzcWzmL0aHqKPUAYP9RcoCqQiK-0yVsNqTbprQRUEBQrj3l35xn_85gzSEp1eiEx8VGqyQVkQm64mfMpriNrSmNMshDZhhPmSKyh9KRShPL0i3YzMwbuwpoOu7mFSPQrSsZnw0vRQbX73Wu_-o83xRG4yqE4leoKsqkAR-1MenVAu2nAgKOe1yz50DOzhrJx2dD-G5J2N-S2uD0Zm3M9j_R15aFi7VSLo-3ARq1STiH60GWqIOSbin3Q3LOXN_CB-jRAu3OWXzP0-8rRnTJgNSm9VHFuAlT3-6UDRjPgt-rS5j8QpJyXg.qgfeQ1cZPtakVfUiyazAog';

  try {
    // First, check what campaigns the API returns
    const response = await fetch('http://localhost:3001/api/calendar/campaigns?' + new URLSearchParams({
      startDate: '2025-09-01T00:00:00.000Z',
      endDate: '2025-09-30T23:59:59.999Z'
    }), {
      headers: {
        'Cookie': `next-auth.session-token=${sessionToken}`
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch campaigns:', response.status);
      return;
    }

    const data = await response.json();
    console.log('📊 Calendar API Response:', {
      totalCampaigns: data.campaigns?.length || 0,
      historicalCampaigns: data.historical || 0,
      scheduledCampaigns: data.scheduled || 0
    });

    // Check a few sample campaigns
    if (data.campaigns && data.campaigns.length > 0) {
      console.log('\n📧 Sample Campaigns:');
      data.campaigns.slice(0, 3).forEach((campaign, i) => {
        console.log(`Campaign ${i + 1}:`, {
          name: campaign.name,
          date: campaign.date,
          channel: campaign.channel,
          status: campaign.status,
          isScheduled: campaign.isScheduled,
          hasPerformanceData: !!campaign.performance,
          recipients: campaign.performance?.recipients || 0,
          revenue: campaign.performance?.revenue || 0,
          openRate: campaign.performance?.openRate || 0
        });
      });

      // Calculate stats like the component does
      const sentCampaigns = data.campaigns.filter(c => {
        const isSent = !c.isScheduled &&
                       c.status !== 'scheduled' &&
                       c.status !== 'draft' &&
                       (c.performance?.recipients > 0 || c.performance?.delivered > 0);
        return isSent;
      });

      console.log('\n📈 Stats Calculation:', {
        totalCampaigns: data.campaigns.length,
        sentCampaigns: sentCampaigns.length,
        scheduledCampaigns: data.campaigns.filter(c => c.isScheduled || c.status === 'scheduled').length
      });

      if (sentCampaigns.length > 0) {
        const totalRecipients = sentCampaigns.reduce((sum, c) =>
          sum + (c.performance?.recipients || c.performance?.delivered || 0), 0);
        const totalRevenue = sentCampaigns.reduce((sum, c) =>
          sum + (c.performance?.revenue || c.performance?.conversion_value || 0), 0);

        console.log('💰 Calculated Stats:', {
          totalRecipients,
          totalRevenue,
          avgRecipientsPerCampaign: totalRecipients / sentCampaigns.length
        });
      }
    } else {
      console.log('❌ No campaigns returned from API');
    }

  } catch (error) {
    console.error('Error testing calendar:', error);
  }
}

testCalendarStats();
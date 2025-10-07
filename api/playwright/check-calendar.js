// Playwright script to check calendar frontend
const sessionToken = 'eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..WBiVHOOEc7LP04h3.eu4hLLukOPRcIpH3T6RhffJd6-3viIB9paxnyTvYY0IbJNS3iGay87irdrcSdFF6Pz_KoajfpXCsHhdo0wXP13_Q6XYu0ytNrvbqhquIL9gYkqHoK3SW8Drs2r0ZqvgLlrmuTxJrd09YqSTD8fw6pUVxCJqyMO_p9uaBLB79PH563PNUmY4mYNj-_1npG286EyyArViG0KT0dYwYLtzxwVSTH55fruMVbvsZ-9CB2EXHwLhWWvynLqFe5KS0mHpWFsKLM-dooFmyEtOCjkGsQdC-3_sNbaUXaAFbLxHMfTZrGUFaH0TKInMIjpNJQR9X2V64bORR0txEYNbxkHb7HLqKWSYNhZqVcnKm_qo65sSbBWaeHJ3XAv7AOZFjkRGfPE2Yw6fFyTngRatpr-S_15X0gvQMD-kK4KarmHlGs-g4QtclYyMoaJjJZmuzaj15eSgaMXe7pq9qtLDPlj2VQVHCOEh0QMAplSkWyhpelTBR0mQmGwXQrNWzmmm5OIyqWlPJyyFMsHsD0rFf7KluYXYPuWw_dMMHqrbjenNGspcTl51K-R4Sm8EP0w3ZArYYKVdnz66tDnzVRE3qTk3wXdm7NAIuvU0Ga8-zkWD6WwdaTuQ1YNRn4OS-6uNmME6pL6sr8_lkaZi6HbNcOiwg637qCdBXPYPcj_qw70U1FVCAi0VfJACUyCB9oXmSKf64WKK-avGhuD0ujnP584W_kewOkJje01wIFAuzbpY7N0bW_K9rMiWrKNOy8vrHZzoic-M4b6-JvJzQr-BNo7mFHCgs2tyxAGLAPM6VQTUl5RSrjCu8QfXVizbhZ7vabKOCsgZK4ZBn8MCwnjMEyz9RemeSZl6rtIzH_K5bMTEuDktRBPzks6SOua1aGIhogEV6dhJ96ro1LAL_Wa37L6Zyt320zMu3t4u2O28YAYuH7cUGjQoOelKNC7rwJmjL73xyceXgB85vl0NgPrePFRfarg_yabTSbPdNMITOiLNK4bpQnI8kio8iTuTiVD4JhcsVcIzqYGMNxIWgAhRQ8uO4upx_UQ2eddtf3q_TYLDhVNhAuW2BK_6MRdP-JFH1K9NNc6DIltWr9cjQ39WMKxI3ai1-0Eh0U_OQtmUPtB9S8ih_omKB52RCbnxSgHeJ6jMFna6UAamyvghe0Xko7xL4JA-Jy3KwljngSNyFNvGQW1kw-wRx_WF50BSdLJJxmhgpVk9QzPoD4YeAmLtQP3S7oW6DZe1H_aujefsiAhFxv8QoHt9M7YBylhFOmzzcWzmL0aHqKPUAYP9RcoCqQiK-0yVsNqTbprQRUEBQrj3l35xn_85gzSEp1eiEx8VGqyQVkQm64mfMpriNrSmNMshDZhhPmSKyh9KRShPL0i3YzMwbuwpoOu7mFSPQrSsZnw0vRQbX73Wu_-o83xRG4yqE4leoKsqkAR-1MenVAu2nAgKOe1yz50DOzhrJx2dD-G5J2N-S2uD0Zm3M9j_R15aFi7VSLo-3ARq1STiH60GWqIOSbin3Q3LOXN_CB-jRAu3OWXzP0-8rRnTJgNSm9VHFuAlT3-6UDRjPgt-rS5j8QpJyXg.qgfeQ1cZPtakVfUiyazAog';

const requestBody = {
  "action": "screenshot-and-extract",
  "url": "http://localhost:3001/calendar",
  "sessionToken": sessionToken,
  "viewport": { "width": 1280, "height": 720 },
  "selectors": {
    "stats": ".grid.grid-cols-2.md\\:grid-cols-4.lg\\:grid-cols-6",
    "campaignsSent": "div:has(span:text('Campaigns Sent')) div.text-2xl",
    "recipients": "div:has(span:text('Recipients')) div.text-2xl",
    "revenue": "div:has(span:text('Total Revenue')) div.text-2xl",
    "openRate": "div:has(span:text('Avg Open Rate')) div.text-2xl"
  },
  "consoleCapture": true,
  "waitForSelector": ".grid.grid-cols-2.md\\:grid-cols-4.lg\\:grid-cols-6"
};

// Make the request
fetch('http://localhost:3001/api/playwright', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(requestBody)
})
.then(response => response.json())
.then(data => {
  console.log('📊 Calendar Stats from Frontend:');
  console.log('Campaigns Sent:', data.data?.campaignsSent);
  console.log('Recipients:', data.data?.recipients);
  console.log('Revenue:', data.data?.revenue);
  console.log('Open Rate:', data.data?.openRate);

  if (data.console && data.console.length > 0) {
    console.log('\n📝 Console logs from frontend:');
    data.console.filter(log => log.includes('CampaignStats') || log.includes('campaigns')).forEach(log => {
      console.log(log);
    });
  }
})
.catch(error => console.error('Error:', error));
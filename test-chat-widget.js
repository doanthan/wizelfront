const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Navigate to the app
  await page.goto('http://localhost:3000');
  
  // Wait for and click the chat widget button
  await page.waitForSelector('button:has(svg)', { timeout: 5000 });
  await page.click('button:has(svg)');
  
  // Wait for chat widget to open
  await page.waitForSelector('.shadow-2xl', { timeout: 5000 });
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'chat-widget-test.png' });
  
  // Get the dimensions and position of elements
  const chatCard = await page.locator('.shadow-2xl').boundingBox();
  const inputArea = await page.locator('input[placeholder="Ask about your data..."]').boundingBox();
  
  console.log('Chat Card:', chatCard);
  console.log('Input Area:', inputArea);
  
  // Check if input is at the bottom
  if (inputArea) {
    const distanceFromBottom = (chatCard.y + chatCard.height) - (inputArea.y + inputArea.height);
    console.log('Distance from bottom:', distanceFromBottom);
  }
  
  // Keep browser open for manual inspection
  await page.pause();
  
  await browser.close();
})();
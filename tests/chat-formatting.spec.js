/**
 * Playwright test for AI chat formatting
 * Tests that the chat properly renders:
 * - Bold text without ** artifacts
 * - Single bullet points (no doubles)
 * - Lucide icons instead of emojis
 * - Proper spacing between words
 */

const { test, expect } = require('@playwright/test');

test.describe('AI Chat Formatting', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard (or any page with chat)
    await page.goto('http://localhost:3000/dashboard');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should render text without stray ** characters', async ({ page }) => {
    // Open chat
    const chatButton = page.locator('button[aria-label="Open Wizel AI Assistant"]');
    if (await chatButton.isVisible()) {
      await chatButton.click();
    }

    // Wait for chat to open
    await page.waitForSelector('[role="textbox"]', { timeout: 5000 });

    // Send a test message that would trigger the formatting issue
    const input = page.locator('textarea[placeholder*="Ask about"]');
    await input.fill('Show me campaign performance');
    await input.press('Enter');

    // Wait for AI response
    await page.waitForSelector('.bg-gray-100', { timeout: 10000 });

    // Get the AI response text
    const aiMessage = page.locator('.bg-gray-100').last();
    const messageText = await aiMessage.textContent();

    // Check that there are NO stray ** characters in the response
    expect(messageText).not.toContain('**massive');
    expect(messageText).not.toContain('**99%');
    expect(messageText).not.toMatch(/\*\*[a-zA-Z]/); // No ** followed by letter

    console.log('✅ No stray ** characters found');
  });

  test('should not have double bullet points', async ({ page }) => {
    // Open chat
    const chatButton = page.locator('button[aria-label="Open Wizel AI Assistant"]');
    if (await chatButton.isVisible()) {
      await chatButton.click();
    }

    await page.waitForSelector('[role="textbox"]', { timeout: 5000 });

    // Send message
    const input = page.locator('textarea[placeholder*="Ask about"]');
    await input.fill('What are the key findings?');
    await input.press('Enter');

    // Wait for response
    await page.waitForSelector('.bg-gray-100', { timeout: 10000 });

    // Check for bullet points in the rendered HTML
    const bulletPoints = page.locator('.text-sky-blue'); // Our bullet class
    const count = await bulletPoints.count();

    // Get all list items
    const listItems = page.locator('div.flex.gap-2');
    const listItemCount = await listItems.count();

    console.log(`Found ${count} bullet points and ${listItemCount} list items`);

    // Each list item should have exactly ONE bullet
    for (let i = 0; i < listItemCount; i++) {
      const item = listItems.nth(i);
      const bullets = item.locator('.text-sky-blue');
      const bulletCount = await bullets.count();

      expect(bulletCount).toBeLessThanOrEqual(1);
    }

    console.log('✅ No double bullet points found');
  });

  test('should render Lucide icons, not emojis', async ({ page }) => {
    // Open chat
    const chatButton = page.locator('button[aria-label="Open Wizel AI Assistant"]');
    if (await chatButton.isVisible()) {
      await chatButton.click();
    }

    await page.waitForSelector('[role="textbox"]', { timeout: 5000 });

    // Send message
    const input = page.locator('textarea[placeholder*="Ask about"]');
    await input.fill('Analyze my performance');
    await input.press('Enter');

    // Wait for response
    await page.waitForSelector('.bg-gray-100', { timeout: 10000 });

    // Check for Lucide icon SVGs (they have specific classes)
    const lucideIcons = page.locator('svg.lucide');
    const iconCount = await lucideIcons.count();

    console.log(`Found ${iconCount} Lucide icons`);

    // Should have at least some icons in the response
    expect(iconCount).toBeGreaterThan(0);

    // Get the message text and verify no emoji characters remain
    const aiMessage = page.locator('.bg-gray-100').last();
    const messageText = await aiMessage.textContent();

    // Common emojis that should NOT appear
    const emojiPattern = /[👋🚀✅📈⚠️💡🔍📊]/;
    expect(messageText).not.toMatch(emojiPattern);

    console.log('✅ Using Lucide icons, no emojis found');
  });

  test('should have proper spacing between words', async ({ page }) => {
    // Open chat
    const chatButton = page.locator('button[aria-label="Open Wizel AI Assistant"]');
    if (await chatButton.isVisible()) {
      await chatButton.click();
    }

    await page.waitForSelector('[role="textbox"]', { timeout: 5000 });

    // Send message
    const input = page.locator('textarea[placeholder*="Ask about"]');
    await input.fill('How is my conversion rate?');
    await input.press('Enter');

    // Wait for response
    await page.waitForSelector('.bg-gray-100', { timeout: 10000 });

    const aiMessage = page.locator('.bg-gray-100').last();
    const messageText = await aiMessage.textContent();

    // Check for common spacing issues
    expect(messageText).not.toContain('conversionindicates');
    expect(messageText).not.toContain('1.35%conversion');
    expect(messageText).not.toMatch(/[a-z][A-Z]/); // No camelCase without space

    console.log('✅ Proper spacing between words');
  });

  test('should render bold text properly', async ({ page }) => {
    // Open chat
    const chatButton = page.locator('button[aria-label="Open Wizel AI Assistant"]');
    if (await chatButton.isVisible()) {
      await chatButton.click();
    }

    await page.waitForSelector('[role="textbox"]', { timeout: 5000 });

    // Send message
    const input = page.locator('textarea[placeholder*="Ask about"]');
    await input.fill('Give me an executive summary');
    await input.press('Enter');

    // Wait for response
    await page.waitForSelector('.bg-gray-100', { timeout: 10000 });

    // Check for <strong> tags (our bold rendering)
    const boldElements = page.locator('strong.font-bold');
    const boldCount = await boldElements.count();

    console.log(`Found ${boldCount} bold elements`);

    // Should have some bold text in executive summary
    expect(boldCount).toBeGreaterThan(0);

    // Verify bold elements have proper classes
    for (let i = 0; i < Math.min(boldCount, 5); i++) {
      const bold = boldElements.nth(i);
      const classes = await bold.getAttribute('class');

      expect(classes).toContain('font-bold');
      expect(classes).toContain('text-gray-900');
    }

    console.log('✅ Bold text rendered properly with <strong> tags');
  });

  test('comprehensive formatting check', async ({ page }) => {
    // Open chat
    const chatButton = page.locator('button[aria-label="Open Wizel AI Assistant"]');
    if (await chatButton.isVisible()) {
      await chatButton.click();
    }

    await page.waitForSelector('[role="textbox"]', { timeout: 5000 });

    // Send message that exercises all formatting
    const input = page.locator('textarea[placeholder*="Ask about"]');
    await input.fill('Give me a detailed analysis of October performance with key findings and recommendations');
    await input.press('Enter');

    // Wait for comprehensive response
    await page.waitForSelector('.bg-gray-100', { timeout: 15000 });

    const aiMessage = page.locator('.bg-gray-100').last();
    const messageHTML = await aiMessage.innerHTML();
    const messageText = await aiMessage.textContent();

    // Comprehensive checks
    const checks = {
      'No stray **': !messageText.includes('**') || messageText.match(/\*\*[^*]+\*\*/),
      'No double bullets': !messageHTML.includes('• -') && !messageHTML.includes('•\n-'),
      'Has Lucide icons': messageHTML.includes('lucide') || messageHTML.includes('<svg'),
      'Has bold text': messageHTML.includes('<strong'),
      'Proper spacing': !messageText.match(/[a-z][A-Z]/) && !messageText.includes('conversionindicates'),
      'Has bullet lists': messageHTML.includes('text-sky-blue') || messageHTML.includes('flex gap-2'),
    };

    console.log('\n📊 Formatting Check Results:');
    for (const [check, passed] of Object.entries(checks)) {
      console.log(`${passed ? '✅' : '❌'} ${check}`);
      expect(passed).toBe(true);
    }

    console.log('\n✅ All formatting checks passed!');
  });
});

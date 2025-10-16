const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const context = await browser.newContext();

  await context.addCookies([{
    name: 'next-auth.session-token',
    value: 'eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..2mqJQ3zqLbDXDpzs.6vaLbgMuSGU3r0LAQMqWe1DnyxJHd7wuF_2nfTA1dItfuosK2dFsMTDVncxr30s7VMTiukdv8VzDW7nH2SLeuvmOGfqSf58e7W4PiySohOI8jPmictHQHFNUvBennVFT4jW-nwRiWFR7HXU13wj9mpZrz1t73xs59jYjAyuuCKoAyntA492abYNjt0JGaQWPSjGg92fMsmLid-p9933IC0wgIaH7RvTjQvQQPh0pH73mwYBxHYLAnAVuEUyOkrI3uOscV4kKmiw-FIkdZdYvbgFxlAajxr4hYBuII1T_dOlCCMajj3X_B5FYUcKGsDM4WwE5DQRnv4jcRU-9ueCpPpCxRnbmbqZnmygU0sO84g.ZSqSe2AnEA45LNp1nFICEw',
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    secure: false,
    sameSite: 'Lax'
  }]);

  const page = await context.newPage();

  console.log('Navigating to brand page...');
  await page.goto('http://localhost:3000/store/dLYXCCm/brand/jurlique');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  console.log('\n=== TEST 1: Mission Statement Field ===');

  // Find and click Mission Statement
  const missionLabel = page.locator('text=Mission Statement').first();
  const missionSection = missionLabel.locator('xpath=ancestor::div[contains(@class, "space-y")]');
  const editableDiv = missionSection.locator('div.cursor-pointer').first();

  if (await editableDiv.isVisible()) {
    console.log('✓ Found Mission Statement field');
    await editableDiv.click();
    await page.waitForTimeout(1000);

    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible()) {
      const originalValue = await textarea.inputValue();
      console.log(`✓ Textarea opened. Original text length: ${originalValue.length} chars`);

      // Test typing at END
      console.log('\n--- Typing at END of text ---');
      await textarea.click();
      await page.keyboard.press('End');
      await page.waitForTimeout(500);

      let cursorBefore = await textarea.evaluate(el => el.selectionStart);
      console.log(`Cursor position after End key: ${cursorBefore}`);

      console.log('Typing "TEST" character by character...');

      await page.keyboard.type('T');
      await page.waitForTimeout(400);
      let value1 = await textarea.inputValue();
      let cursor1 = await textarea.evaluate(el => el.selectionStart);
      console.log(`After "T": cursor=${cursor1}, last 10 chars: "${value1.slice(-10)}"`);

      await page.keyboard.type('E');
      await page.waitForTimeout(400);
      let value2 = await textarea.inputValue();
      let cursor2 = await textarea.evaluate(el => el.selectionStart);
      console.log(`After "E": cursor=${cursor2}, last 10 chars: "${value2.slice(-10)}"`);

      await page.keyboard.type('S');
      await page.waitForTimeout(400);
      let value3 = await textarea.inputValue();
      let cursor3 = await textarea.evaluate(el => el.selectionStart);
      console.log(`After "S": cursor=${cursor3}, last 10 chars: "${value3.slice(-10)}"`);

      await page.keyboard.type('T');
      await page.waitForTimeout(400);
      let finalValue = await textarea.inputValue();
      let finalCursor = await textarea.evaluate(el => el.selectionStart);
      console.log(`After "T": cursor=${finalCursor}, last 10 chars: "${finalValue.slice(-10)}"`);

      // Check results
      if (finalValue.endsWith('TEST')) {
        console.log('✅ TEST 1 PASSED: "TEST" correctly added at the end');
      } else if (finalValue.startsWith('TEST')) {
        console.log('❌ TEST 1 FAILED: Text went to the beginning!');
        console.log(`   First 20 chars: "${finalValue.substring(0, 20)}"`);
      } else {
        console.log('❌ TEST 1 FAILED: Text in unexpected location');
        console.log(`   Start: "${finalValue.substring(0, 20)}"`);
        console.log(`   End: "${finalValue.slice(-20)}"`);
      }

      // Reset
      await textarea.fill(originalValue);
      await page.waitForTimeout(500);

      // Test typing at BEGINNING
      console.log('\n--- Typing at BEGINNING of text ---');
      await textarea.click();
      await page.keyboard.press('Home');
      await page.waitForTimeout(500);

      console.log('Typing "NEW "...');
      await page.keyboard.type('NEW ');
      await page.waitForTimeout(500);

      const finalValue2 = await textarea.inputValue();
      if (finalValue2.startsWith('NEW ')) {
        console.log('✅ TEST 2 PASSED: "NEW " correctly added at beginning');
      } else {
        console.log('❌ TEST 2 FAILED: Text not at beginning');
        console.log(`   First 20 chars: "${finalValue2.substring(0, 20)}"`);
      }

      // Reset
      await textarea.fill(originalValue);
      await page.waitForTimeout(500);

      // Test typing in MIDDLE
      console.log('\n--- Typing in MIDDLE of text ---');
      await textarea.click();
      const midPoint = Math.floor(originalValue.length / 2);
      await textarea.evaluate((el, pos) => {
        el.setSelectionRange(pos, pos);
      }, midPoint);
      await page.waitForTimeout(500);

      console.log(`Cursor at position ${midPoint}, typing "MID"...`);
      await page.keyboard.type('MID');
      await page.waitForTimeout(500);

      const finalValue3 = await textarea.inputValue();
      if (finalValue3.includes('MID') && !finalValue3.startsWith('MID') && !finalValue3.endsWith('MID')) {
        console.log('✅ TEST 3 PASSED: "MID" correctly inserted in middle');
      } else {
        console.log('❌ TEST 3 FAILED: Text not in middle');
        const midIndex = finalValue3.indexOf('MID');
        console.log(`   "MID" found at position: ${midIndex}`);
      }
    }
  }

  console.log('\n=== Summary ===');
  console.log('If all tests passed, the cursor issue is fixed!');
  console.log('Browser will stay open for 10 seconds...');
  await page.waitForTimeout(10000);

  await browser.close();
})();

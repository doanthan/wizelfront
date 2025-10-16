const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  
  await context.addCookies([{
    name: 'next-auth.session-token',
    value: 'eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..kyh-HSM1ggF7_8Tq.RMnAlhPU8ibMNSkcY9voGqrQcZ8ltWOU4C4GZ4FnRcQKJnFS2C75XtxUhFkvCJco3v2o1ohQrn_LDfw09UF_0eCAlatvZPvJ8kF-N-4vMxWNlGF-BW51vkVPgtqdEPCLnXCdr4nbFcc3L-OSAtz8_DQlvaYzsr5CIr0DvoOj5aPJhkS85kfpmYi1Lv_i-4Y14hDDIkq3o_ZUX3cHM3d60El_TKKzC0iMZ7M0EPt5rrTzmsJ3RWq-35dd7SItej2fo15CaDxEHAqYuN7uEOpmto1CGHcJVAOCv_7vYZUR82t9F1e5cZLI2MW6CZ2Aa-bzGqQhkqs0S0UCcnzAorfItL-peyArega-LpGPJzitsg.WiJQgW02Y-Bo_XafAZ4Uqg',
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    sameSite: 'Lax'
  }]);

  const page = await context.newPage();
  await page.goto('http://localhost:3000/store/dLYXCCm/brand/jurlique');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  const getCardInfo = () => page.evaluate(() => {
    const brandSettings = Array.from(document.querySelectorAll('*')).find(el => 
      el.textContent && el.textContent.trim() === 'Brand Settings' && el.tagName === 'H3'
    );
    if (!brandSettings) return null;
    
    let card = brandSettings;
    while (card && !card.className.includes('rounded-lg')) {
      card = card.parentElement;
    }
    
    if (!card) return null;
    
    const rect = card.getBoundingClientRect();
    const styles = window.getComputedStyle(card);
    
    return {
      scrollY: window.scrollY,
      position: styles.position,
      top: styles.top,
      rect: {
        top: Math.round(rect.top),
        left: Math.round(rect.left)
      }
    };
  });

  console.log('\n📊 BEFORE SCROLL:');
  const before = await getCardInfo();
  console.log(JSON.stringify(before, null, 2));

  console.log('\n⬇️  Scrolling 100px...');
  await page.evaluate(() => window.scrollTo({ top: 100, behavior: 'instant' }));
  await page.waitForTimeout(500);
  const after100 = await getCardInfo();
  console.log('After 100px:', JSON.stringify(after100, null, 2));

  console.log('\n⬇️  Scrolling 200px...');
  await page.evaluate(() => window.scrollTo({ top: 200, behavior: 'instant' }));
  await page.waitForTimeout(500);
  const after200 = await getCardInfo();
  console.log('After 200px:', JSON.stringify(after200, null, 2));

  console.log('\n⬇️  Scrolling 500px...');
  await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'instant' }));
  await page.waitForTimeout(500);
  const after500 = await getCardInfo();
  console.log('After 500px:', JSON.stringify(after500, null, 2));

  console.log('\n\n🔍 ANALYSIS:');
  if (before && after500) {
    const cardMoved = before.rect.top - after500.rect.top;
    const scrolledAmount = after500.scrollY;
    
    console.log('Scrolled: ' + scrolledAmount + 'px');
    console.log('Card moved: ' + cardMoved + 'px');
    console.log('Expected sticky top: 96px');
    console.log('Actual top after scroll: ' + after500.rect.top + 'px');
    
    if (Math.abs(after500.rect.top - 96) < 10) {
      console.log('\n✅ STICKY IS WORKING! Card is at expected position.');
    } else if (cardMoved === scrolledAmount) {
      console.log('\n❌ STICKY NOT WORKING! Card scrolls with content (moved ' + cardMoved + 'px = scroll amount)');
    } else if (after500.rect.top === 96) {
      console.log('\n✅ STICKY IS WORKING! Card stopped at 96px from top.');
    }
  }

  await page.screenshot({ path: '/tmp/scroll-test-500.png' });
  console.log('\n📸 Screenshot saved: /tmp/scroll-test-500.png');

  console.log('\n⏸️  Browser open for 5 seconds...');
  await page.waitForTimeout(5000);
  await browser.close();
})();

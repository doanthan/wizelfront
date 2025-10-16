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

  console.log('\n🔍 FINDING BRAND SETTINGS CARD:');
  
  const result = await page.evaluate(() => {
    // Find all elements with "Brand Settings" text
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null
    );

    const brandSettingsNodes = [];
    let node;
    while (node = walker.nextNode()) {
      if (node.nodeValue && node.nodeValue.trim() === 'Brand Settings') {
        brandSettingsNodes.push(node.parentElement);
      }
    }

    if (brandSettingsNodes.length === 0) {
      return { error: 'No "Brand Settings" text found' };
    }

    // Get the card containing Brand Settings
    let card = brandSettingsNodes[0];
    while (card && !card.className.includes('rounded')) {
      card = card.parentElement;
    }

    if (!card) {
      return { error: 'Could not find card element' };
    }

    const styles = window.getComputedStyle(card);
    const rect = card.getBoundingClientRect();

    // Get all parent elements
    const parents = [];
    let parent = card.parentElement;
    while (parent && parent !== document.body) {
      const pStyles = window.getComputedStyle(parent);
      parents.push({
        tag: parent.tagName,
        classes: parent.className.substring(0, 80),
        position: pStyles.position,
        overflow: pStyles.overflow,
        overflowX: pStyles.overflowX,
        overflowY: pStyles.overflowY
      });
      parent = parent.parentElement;
    }

    return {
      card: {
        tag: card.tagName,
        classes: card.className.substring(0, 150),
        position: styles.position,
        top: styles.top,
        zIndex: styles.zIndex,
        rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
      },
      parents: parents
    };
  });

  console.log(JSON.stringify(result, null, 2));

  console.log('\n⏸️  Keeping browser open for 10 seconds...');
  await page.waitForTimeout(10000);
  await browser.close();
})();

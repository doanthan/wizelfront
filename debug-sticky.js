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

  console.log('\n🔍 INSPECTING ASIDE ELEMENT STRUCTURE:');
  const structure = await page.evaluate(() => {
    const aside = document.querySelector('aside');
    if (!aside) return { error: 'No aside found' };

    const asideStyles = window.getComputedStyle(aside);
    const children = Array.from(aside.children).map(child => {
      const styles = window.getComputedStyle(child);
      return {
        tag: child.tagName,
        classes: child.className,
        position: styles.position,
        top: styles.top,
        display: styles.display,
        hasSticky: child.className.includes('sticky'),
        rect: {
          top: child.getBoundingClientRect().top,
          height: child.getBoundingClientRect().height
        }
      };
    });

    return {
      aside: {
        tag: aside.tagName,
        classes: aside.className,
        position: asideStyles.position,
        display: asideStyles.display,
        overflow: asideStyles.overflow,
        overflowY: asideStyles.overflowY
      },
      children: children
    };
  });

  console.log(JSON.stringify(structure, null, 2));

  await browser.close();
})();

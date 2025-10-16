const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  // Set authentication cookie
  await context.addCookies([{
    name: 'next-auth.session-token',
    value: 'eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..kyh-HSM1ggF7_8Tq.RMnAlhPU8ibMNSkcY9voGqrQcZ8ltWOU4C4GZ4FnRcQKJnFS2C75XtxUhFkvCJco3v2o1ohQrn_LDfw09UF_0eCAlatvZPvJ8kF-N-4vMxWNlGF-BW51vkVPgtqdEPCLnXCdr4nbFcc3L-OSAtz8_DQlvaYzsr5CIr0DvoOj5aPJhkS85kfpmYi1Lv_i-4Y14hDDIkq3o_ZUX3cHM3d60El_TKKzC0iMZ7M0EPt5rrTzmsJ3RWq-35dd7SItej2fo15CaDxEHAqYuN7uEOpmto1CGHcJVAOCv_7vYZUR82t9F1e5cZLI2MW6CZ2Aa-bzGqQhkqs0S0UCcnzAorfItL-peyArega-LpGPJzitsg.WiJQgW02Y-Bo_XafAZ4Uqg',
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    sameSite: 'Lax'
  }]);

  const page = await context.newPage();

  console.log('📍 Navigating to brand page with auth...');
  await page.goto('http://localhost:3000/store/dLYXCCm/brand/jurlique');

  console.log('⏳ Waiting for page to load...');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Get detailed info about the sidebar card
  console.log('\n📊 Analyzing Brand Settings Card:');
  const cardInfo = await page.evaluate(() => {
    const aside = document.querySelector('aside');
    const allDivs = Array.from(aside?.querySelectorAll('div') || []);
    
    // Find the card - look for the one with "Brand Settings" text
    const cardWithTitle = allDivs.find(div => {
      const text = div.textContent || '';
      return text.includes('Brand Settings') && div.className;
    });

    if (!cardWithTitle) {
      return { error: 'Card not found', asideHTML: aside?.innerHTML.substring(0, 500) };
    }

    const rect = cardWithTitle.getBoundingClientRect();
    const styles = window.getComputedStyle(cardWithTitle);

    return {
      found: true,
      tag: cardWithTitle.tagName,
      classes: cardWithTitle.className,
      position: styles.position,
      top: styles.top,
      zIndex: styles.zIndex,
      rect: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      },
      scrollY: window.scrollY,
      // Check parent elements for overflow issues
      parentOverflow: (() => {
        let el = cardWithTitle.parentElement;
        const overflows = [];
        while (el && el !== document.body) {
          const s = window.getComputedStyle(el);
          if (s.overflow !== 'visible' || s.overflowX !== 'visible' || s.overflowY !== 'visible') {
            overflows.push({
              tag: el.tagName,
              class: el.className.substring(0, 50),
              overflow: s.overflow,
              overflowX: s.overflowX,
              overflowY: s.overflowY
            });
          }
          el = el.parentElement;
        }
        return overflows;
      })()
    };
  });

  console.log(JSON.stringify(cardInfo, null, 2));

  // Take screenshot before scroll
  await page.screenshot({ path: '/tmp/auth-sticky-before.png', fullPage: false });
  console.log('📸 Screenshot saved: /tmp/auth-sticky-before.png');

  // Scroll down
  console.log('\n⬇️  Scrolling down 800px...');
  await page.evaluate(() => window.scrollTo({ top: 800, behavior: 'smooth' }));
  await page.waitForTimeout(1000);

  // Check card position after scroll
  const afterScroll = await page.evaluate(() => {
    const aside = document.querySelector('aside');
    const allDivs = Array.from(aside?.querySelectorAll('div') || []);
    const cardWithTitle = allDivs.find(div => {
      const text = div.textContent || '';
      return text.includes('Brand Settings') && div.className;
    });

    if (!cardWithTitle) return { error: 'Card not found after scroll' };

    const rect = cardWithTitle.getBoundingClientRect();
    const styles = window.getComputedStyle(cardWithTitle);

    return {
      scrollY: window.scrollY,
      position: styles.position,
      top: styles.top,
      rect: {
        top: rect.top,
        left: rect.left
      },
      isSticky: rect.top < 150 && rect.top > 50
    };
  });

  console.log('\n📊 After Scroll (800px):');
  console.log(JSON.stringify(afterScroll, null, 2));

  await page.screenshot({ path: '/tmp/auth-sticky-after.png', fullPage: false });
  console.log('📸 Screenshot saved: /tmp/auth-sticky-after.png');

  // Analysis
  console.log('\n\n🔍 ANALYSIS:');
  console.log('═══════════════════════════════════════════════════');
  
  if (cardInfo.found) {
    console.log(`Current position CSS: ${cardInfo.position}`);
    console.log(`Current top CSS: ${cardInfo.top}`);
    console.log(`Classes: ${cardInfo.classes.substring(0, 100)}`);
    
    if (cardInfo.parentOverflow && cardInfo.parentOverflow.length > 0) {
      console.log('\n⚠️  FOUND OVERFLOW ISSUES IN PARENTS:');
      cardInfo.parentOverflow.forEach((p, i) => {
        console.log(`  ${i + 1}. <${p.tag}> overflow: ${p.overflow}, overflowX: ${p.overflowX}, overflowY: ${p.overflowY}`);
      });
    } else {
      console.log('\n✅ No overflow issues in parent elements');
    }

    if (afterScroll.isSticky) {
      console.log('\n✅ STICKY IS WORKING!');
      console.log(`   Card stayed at ${afterScroll.rect.top}px from top`);
    } else {
      console.log('\n❌ STICKY IS NOT WORKING!');
      console.log(`   Card is at ${afterScroll.rect.top}px from top (should be ~96px)`);
      console.log(`   Scroll position: ${afterScroll.scrollY}px`);
    }
  }

  console.log('\n⏸️  Browser will stay open for 10 seconds...');
  await page.waitForTimeout(10000);

  await browser.close();
  console.log('\n✅ Analysis complete!');
})();

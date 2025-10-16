const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  console.log('📍 Navigating to brand page...');
  await page.goto('http://localhost:3000/store/dLYXCCm/brand/jurlique');

  console.log('⏳ Waiting for page to load...');
  await page.waitForLoadState('networkidle');

  // Wait for the "Brand Settings" text to appear (indicating sidebar loaded)
  try {
    await page.waitForSelector('text=Brand Settings', { timeout: 10000 });
    console.log('✅ Brand Settings sidebar found');
  } catch (e) {
    console.log('⚠️  Brand Settings sidebar not found, continuing anyway...');
  }

  // Wait for loading to complete
  await page.waitForTimeout(3000);

  // Check initial state
  console.log('\n📊 Initial State (before scroll):');
  const initialState = await page.evaluate(() => {
    const sidebar = document.querySelector('aside');
    // Look for the actual Card component - it should have "sticky" in its className
    const card = Array.from(sidebar?.querySelectorAll('*') || [])
      .find(el => typeof el.className === 'string' && el.className.includes('sticky')) || sidebar?.firstElementChild;

    if (!card) {
      return {
        sidebarExists: !!sidebar,
        cardExists: false,
        allElements: Array.from(sidebar?.children || []).map(el => ({
          tag: el.tagName,
          classes: el.className.substring(0, 100)
        })),
        scrollY: window.scrollY,
        cardPosition: 'N/A'
      };
    }

    const rect = card.getBoundingClientRect();
    const styles = window.getComputedStyle(card);
    return {
      sidebarExists: !!sidebar,
      cardExists: !!card,
      cardTag: card.tagName,
      cardClasses: card.className.substring(0, 100),
      cardTop: rect.top,
      cardLeft: rect.left,
      scrollY: window.scrollY,
      cardPosition: styles.position,
      cardTopStyle: styles.top
    };
  });
  console.log(JSON.stringify(initialState, null, 2));

  // Take initial screenshot
  await page.screenshot({ path: '/tmp/sticky-before-scroll.png', fullPage: false });
  console.log('📸 Screenshot saved: /tmp/sticky-before-scroll.png');

  // Scroll down 500px
  console.log('\n⬇️  Scrolling down 500px...');
  await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'smooth' }));
  await page.waitForTimeout(800);

  const state500 = await page.evaluate(() => {
    const sidebar = document.querySelector('aside');
    const card = Array.from(sidebar?.querySelectorAll('*') || [])
      .find(el => typeof el.className === 'string' && el.className.includes('sticky'));
    if (!card) return { error: 'Card not found' };

    const rect = card.getBoundingClientRect();
    const styles = window.getComputedStyle(card);
    return {
      scrollY: window.scrollY,
      cardTop: Math.round(rect.top),
      cardLeft: Math.round(rect.left),
      cardPosition: styles.position,
      isSticky: rect.top < 150 && rect.top > 50,
      computedTop: styles.top
    };
  });
  console.log('\n📊 State after 500px scroll:');
  console.log(JSON.stringify(state500, null, 2));

  await page.screenshot({ path: '/tmp/sticky-scroll-500.png', fullPage: false });
  console.log('📸 Screenshot saved: /tmp/sticky-scroll-500.png');

  // Scroll down 1000px
  console.log('\n⬇️  Scrolling down 1000px...');
  await page.evaluate(() => window.scrollTo({ top: 1000, behavior: 'smooth' }));
  await page.waitForTimeout(800);

  const state1000 = await page.evaluate(() => {
    const sidebar = document.querySelector('aside');
    const card = Array.from(sidebar?.querySelectorAll('*') || [])
      .find(el => typeof el.className === 'string' && el.className.includes('sticky'));
    if (!card) return { error: 'Card not found' };

    const rect = card.getBoundingClientRect();
    const styles = window.getComputedStyle(card);
    return {
      scrollY: window.scrollY,
      cardTop: Math.round(rect.top),
      cardLeft: Math.round(rect.left),
      cardPosition: styles.position,
      isSticky: rect.top < 150 && rect.top > 50,
      computedTop: styles.top
    };
  });
  console.log('\n📊 State after 1000px scroll:');
  console.log(JSON.stringify(state1000, null, 2));

  await page.screenshot({ path: '/tmp/sticky-scroll-1000.png', fullPage: false });
  console.log('📸 Screenshot saved: /tmp/sticky-scroll-1000.png');

  // Scroll down 1500px
  console.log('\n⬇️  Scrolling down 1500px...');
  await page.evaluate(() => window.scrollTo({ top: 1500, behavior: 'smooth' }));
  await page.waitForTimeout(800);

  const state1500 = await page.evaluate(() => {
    const sidebar = document.querySelector('aside');
    const card = Array.from(sidebar?.querySelectorAll('*') || [])
      .find(el => typeof el.className === 'string' && el.className.includes('sticky'));
    if (!card) return { error: 'Card not found' };

    const rect = card.getBoundingClientRect();
    const styles = window.getComputedStyle(card);
    return {
      scrollY: window.scrollY,
      cardTop: Math.round(rect.top),
      cardLeft: Math.round(rect.left),
      cardPosition: styles.position,
      isSticky: rect.top < 150 && rect.top > 50,
      computedTop: styles.top
    };
  });
  console.log('\n📊 State after 1500px scroll:');
  console.log(JSON.stringify(state1500, null, 2));

  await page.screenshot({ path: '/tmp/sticky-scroll-1500.png', fullPage: false });
  console.log('📸 Screenshot saved: /tmp/sticky-scroll-1500.png');

  // Analysis
  console.log('\n\n🔍 ANALYSIS:');
  console.log('═══════════════════════════════════════════════════');

  const isWorkingProperly =
    state500.isSticky &&
    state1000.isSticky &&
    state1500.isSticky &&
    Math.abs(state500.cardTop - state1000.cardTop) < 50 &&
    Math.abs(state1000.cardTop - state1500.cardTop) < 50;

  if (isWorkingProperly) {
    console.log('✅ STICKY IS WORKING! The card stays in position when scrolling.');
    console.log(`   - Card consistently stays at ~${Math.round(state500.cardTop)}px from top`);
    console.log(`   - CSS position: ${state500.cardPosition}`);
  } else {
    console.log('❌ STICKY IS NOT WORKING! The card is scrolling with the page.');
    console.log(`   - Initial top: ${initialState.cardTop}px`);
    console.log(`   - At 500px scroll: ${state500.cardTop}px`);
    console.log(`   - At 1000px scroll: ${state1000.cardTop}px`);
    console.log(`   - At 1500px scroll: ${state1500.cardTop}px`);
    console.log(`   - CSS position: ${state500.cardPosition}`);
  }

  console.log('\n📁 Screenshots saved in /tmp/');
  console.log('   - /tmp/sticky-before-scroll.png');
  console.log('   - /tmp/sticky-scroll-500.png');
  console.log('   - /tmp/sticky-scroll-1000.png');
  console.log('   - /tmp/sticky-scroll-1500.png');

  console.log('\n⏸️  Browser will stay open for 10 seconds for manual inspection...');
  await page.waitForTimeout(10000);

  await browser.close();
  console.log('\n✅ Test complete!');
})();

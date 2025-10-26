// Quick test to verify emoji detection and bullet removal

const testText = `Expected ROI: 5:1 (retargeting engaged users converts 3-4x higher than cold outreach)
•
Timeline: Launch October 29th (capitalize on October browsing intent)
📈 Success Metrics
•
Primary KPI: Campaign Conversion Rate from 1.35% → 2.0% by November 15th
⚠ Risks & Considerations
🏆 Benchmark Comparison`;

console.log('=== ORIGINAL TEXT ===');
console.log(testText);
console.log('\n');

// Step 1: Strip variation selectors
let cleanText = testText.replace(/[\uFE00-\uFE0F]/g, '');
console.log('=== AFTER STRIPPING VARIATION SELECTORS ===');
console.log(cleanText);
console.log('\n');

// Step 2: Remove double bullet patterns
cleanText = cleanText
  .replace(/^\s*•\s*\n\s*-\s+/gm, '- ')
  .replace(/\n\s*•\s*\n\s*-\s+/gm, '\n- ')
  .replace(/^\s*•\s*$/gm, '')
  .replace(/^\s*-\s*$/gm, '')
  .replace(/\n\s*•\s*\n/gm, '\n')
  .replace(/^•\s*\n/gm, '')
  .replace(/\n•\s*\n/gm, '\n')
  .replace(/\n{3,}/g, '\n\n');

console.log('=== AFTER BULLET REMOVAL ===');
console.log(cleanText);
console.log('\n');

// Step 3: Find emojis
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
const foundEmojis = cleanText.match(emojiRegex);

console.log('=== FOUND EMOJIS ===');
if (foundEmojis) {
  foundEmojis.forEach(emoji => {
    const codePoint = emoji.codePointAt(0).toString(16).toUpperCase();
    console.log(`"${emoji}" = U+${codePoint}`);
  });
} else {
  console.log('No emojis found!');
}

// Test the double bullet pattern fix

const testText = `1.
Email Newsletter (Oct 22) - Your Revenue Leader
•
- Recipients: 2K
•
- Open Rate: 27% (well below 21% benchmark)
•
- Click Rate: 03% (well below 2.6% benchmark)
2.
SMS Newsletter (Oct 22)
•
- Recipients: 5K
•
- Click Rate: 37%`;

console.log('=== ORIGINAL ===');
console.log(testText);
console.log('\n');

let cleanText = testText;

// Current pattern attempts
cleanText = cleanText
  .replace(/^\s*•\s*\n\s*-\s+/gm, '- ')
  .replace(/\n\s*•\s*\n\s*-\s+/gm, '\n- ')
  .replace(/^\s*•\s*$/gm, '')
  .replace(/\n\s*•\s*\n/gm, '\n')
  .replace(/^•\s*\n/gm, '')
  .replace(/\n•\s*\n/gm, '\n')
  .replace(/\n{3,}/g, '\n\n');

console.log('=== AFTER FIRST PASS ===');
console.log(cleanText);
console.log('\n');

// New approach: just remove ALL "•\n-" patterns completely
cleanText = testText
  .replace(/•\s*\n\s*-\s+/g, '');  // Remove "•\n- " completely

console.log('=== AFTER SIMPLE REMOVAL ===');
console.log(cleanText);

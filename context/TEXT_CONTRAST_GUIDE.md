# Text Contrast Guidelines

## CRITICAL: Text Color Requirements

### Light Mode Text Colors

**PRIMARY TEXT (Headings, Important Content)**
- Use: `text-gray-900` (#111827)
- Never use colors lighter than gray-900 for primary text
- Contrast ratio: 15.8:1 (exceeds AAA)

**SECONDARY TEXT (Descriptions, Labels)**  
- Use: `text-gray-700` (#374151) or `text-gray-600` (#475569)
- Minimum: gray-600 for AA compliance
- Contrast ratio: 7.5:1 (exceeds AA)

**MUTED TEXT (Help text, Timestamps)**
- Use: `text-gray-600` (#475569)
- NEVER use gray-500 or lighter for important content
- Minimum contrast: 4.7:1 (meets AA)

**PLACEHOLDER TEXT**
- Use: `text-gray-500` (#6B7280)
- Only for placeholders, never for actual content
- Contrast ratio: 4.5:1 (meets AA minimum)

### Dark Mode Text Colors

**PRIMARY TEXT**
- Use: `text-white` (#FFFFFF) or `text-gray-50` (#F9FAFB)
- Contrast ratio: 15.3:1+ (exceeds AAA)

**SECONDARY TEXT**
- Use: `text-gray-200` (#E5E7EB) or `text-gray-300` (#D1D5DB)
- Contrast ratio: 13.1:1 (exceeds AAA)

**MUTED TEXT**
- Use: `text-gray-400` (#9CA3AF)
- Contrast ratio: 6.1:1 (exceeds AA)

**PLACEHOLDER TEXT**
- Use: `text-gray-500` (#6B7280)
- Contrast ratio: 4.5:1 (meets AA minimum)

## Common Patterns to Follow

### Component Headers
```jsx
// ✅ CORRECT
<h3 className="font-semibold text-gray-900 dark:text-white">Title</h3>
<p className="text-gray-600 dark:text-gray-400">Description</p>

// ❌ WRONG
<h3 className="font-semibold text-slate-gray">Title</h3>
<p className="text-muted-foreground">Description</p>
```

### Form Labels
```jsx
// ✅ CORRECT
<Label className="text-sm text-gray-700 dark:text-gray-300">
  Field Label
</Label>

// ❌ WRONG  
<Label className="text-sm text-gray-500">
  Field Label
</Label>
```

### Help Text
```jsx
// ✅ CORRECT
<span className="text-xs text-gray-600 dark:text-gray-400">
  Help text here
</span>

// ❌ WRONG
<span className="text-xs text-gray-400">
  Help text here
</span>
```

### Interactive Elements
```jsx
// ✅ CORRECT
<button className="text-gray-700 hover:text-sky-blue dark:text-gray-300 dark:hover:text-sky-blue">
  Click me
</button>

// ❌ WRONG
<button className="text-gray-500 hover:text-sky-blue">
  Click me
</button>
```

## Classes to AVOID

**NEVER use these for important content in light mode:**
- `text-muted-foreground`
- `text-gray-500` 
- `text-gray-400`
- `text-gray-300`
- `text-neutral-gray` (unless specifically defined as gray-600+)
- `text-slate-gray` (unless specifically defined as gray-900)

## Classes to USE

**Light Mode Primary Text:**
- `text-gray-900` - Headings, titles
- `text-gray-800` - Important content

**Light Mode Secondary Text:**
- `text-gray-700` - Labels, descriptions
- `text-gray-600` - Help text, metadata

**Dark Mode Primary Text:**
- `text-white` - Headings, titles
- `text-gray-50` - Important content

**Dark Mode Secondary Text:**
- `text-gray-200` - Labels, descriptions  
- `text-gray-300` - Secondary content
- `text-gray-400` - Help text, metadata

## Testing Checklist

Before committing any UI changes:

- [ ] All text in light mode uses gray-600 (#475569) or darker
- [ ] Primary text uses gray-900 (#111827) in light mode
- [ ] Dark mode text uses appropriate light colors
- [ ] Placeholders are the only elements using gray-500
- [ ] No use of `text-muted-foreground` class
- [ ] All interactive text has hover states
- [ ] Text passes WCAG AA contrast requirements (4.5:1)

## Quick Reference

| Content Type | Light Mode | Dark Mode |
|-------------|------------|-----------|
| Headings | text-gray-900 | text-white |
| Body Text | text-gray-800 | text-gray-100 |
| Labels | text-gray-700 | text-gray-300 |
| Descriptions | text-gray-600 | text-gray-400 |
| Placeholders | text-gray-500 | text-gray-500 |
| Disabled | text-gray-400 | text-gray-600 |

## Enforcement

To prevent future contrast issues:

1. Always specify both light and dark mode colors
2. Test in both themes before committing
3. Use the Chrome DevTools contrast checker
4. Reference this guide when creating new components
5. Update `/context/design-principles.md` if new patterns emerge

## Migration Guide

When fixing existing components:

1. Search for `text-muted-foreground` and replace with `text-gray-600 dark:text-gray-400`
2. Search for `text-gray-500` and upgrade to `text-gray-600` unless it's a placeholder
3. Search for `text-gray-400` in light mode contexts and upgrade to `text-gray-600`
4. Ensure all headings use `text-gray-900 dark:text-white`
5. Test the component in both light and dark modes
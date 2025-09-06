# Playwright API Endpoint

This API endpoint allows Claude and other tools to use Playwright for UI testing, screenshot capture, and visual verification.

## Endpoint

```
POST /api/playwright
GET  /api/playwright  (health check)
```

## Available Actions

### 1. Navigate
Navigate to a URL and get page information.

```json
{
  "action": "navigate",
  "url": "http://localhost:3000",
  "options": {
    "waitUntil": "networkidle",
    "timeout": 30000
  }
}
```

### 2. Screenshot
Take a screenshot of a page or specific element.

```json
{
  "action": "screenshot",
  "url": "http://localhost:3000/calendar",
  "fullPage": true,
  "viewport": {
    "width": 1280,
    "height": 720
  },
  "options": {
    "type": "png"
  }
}
```

Screenshot of specific element:
```json
{
  "action": "screenshot",
  "url": "http://localhost:3000",
  "selector": ".calendar-container",
  "waitForSelector": ".calendar-container"
}
```

### 3. Check Element
Verify element existence and get its properties.

```json
{
  "action": "checkElement",
  "url": "http://localhost:3000",
  "selector": "body",
  "options": {
    "waitUntil": "networkidle"
  }
}
```

Response includes:
- exists: boolean
- visible: boolean
- enabled: boolean
- boundingBox: dimensions
- text: text content
- styles: computed CSS styles

### 4. Get Styles
Get computed styles for multiple elements.

```json
{
  "action": "getStyles",
  "url": "http://localhost:3000",
  "options": {
    "selectors": ["body", "h1", ".button", "#header"]
  }
}
```

### 5. Evaluate
Execute custom JavaScript in the page context.

```json
{
  "action": "evaluate",
  "url": "http://localhost:3000",
  "options": {
    "script": "return { fonts: document.fonts.ready.then(() => Array.from(document.fonts).map(f => f.family)) }"
  }
}
```

### 6. Accessibility
Get accessibility tree snapshot.

```json
{
  "action": "accessibility",
  "url": "http://localhost:3000"
}
```

### 7. Performance
Get performance metrics.

```json
{
  "action": "performance",
  "url": "http://localhost:3000"
}
```

### 8. Compare Screenshots
Take a screenshot for visual regression testing.

```json
{
  "action": "compareScreenshots",
  "url": "http://localhost:3000",
  "options": {
    "baseline": "base64_encoded_baseline_image"
  }
}
```

## Common Options

All actions support these common options:

- `viewport`: Set viewport size `{ width: 1280, height: 720 }`
- `deviceScaleFactor`: Device scale factor (default: 1)
- `cookies`: Array of cookies to set before navigation
- `waitForSelector`: Wait for selector before action
- `timeout`: Operation timeout in milliseconds

## Example: Verify Inter Font is Applied

```json
{
  "action": "checkElement",
  "url": "http://localhost:3000",
  "selector": "body"
}
```

Then check the response:
```javascript
// Response will include:
{
  "success": true,
  "result": {
    "exists": true,
    "visible": true,
    "styles": {
      "fontFamily": "Inter, system-ui, -apple-system, sans-serif",
      // ... other styles
    }
  }
}
```

## Example: Full Page UI Check

```javascript
// Check if Inter font is applied correctly
const fontCheck = await fetch('/api/playwright', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'getStyles',
    url: 'http://localhost:3000',
    options: {
      selectors: ['body', 'h1', 'h2', 'p', 'button']
    }
  })
});

const result = await fontCheck.json();
// Verify all elements use Inter font
Object.entries(result.result.styles).forEach(([selector, styles]) => {
  console.log(`${selector}: ${styles.fontFamily}`);
});
```

## Rate Limiting

- Maximum 10 requests per minute per IP address
- Returns 429 status code when limit exceeded

## Security Notes

- Only runs in headless mode
- Sandboxed browser execution
- No access to local file system
- Scripts are evaluated in isolated context

## Error Handling

All errors return with appropriate status codes:
- 400: Bad Request (missing required fields)
- 429: Rate Limit Exceeded
- 500: Internal Server Error

## Usage with Claude

Claude can use this endpoint to:
1. Verify UI changes after code modifications
2. Take screenshots for visual confirmation
3. Check if fonts, colors, and styles are applied correctly
4. Verify element positioning and layout
5. Test responsive design at different viewport sizes
6. Perform accessibility checks
7. Monitor performance metrics
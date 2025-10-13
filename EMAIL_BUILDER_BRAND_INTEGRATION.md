# Email Builder - Store Brand Integration

## Overview

The Email Builder at `/store/[storePublicId]/email-builder` now automatically loads brand settings from the specific store's brand configuration.

## What Was Implemented

### ✅ Dynamic Brand Loading

The `BrandContext` has been updated to:

1. **Fetch Store-Specific Brand Settings**
   - Uses the store's `public_id` from the URL (`noSyAXf` in your example)
   - Calls `/api/store/[storePublicId]/brand-settings` to get brand data
   - Automatically applies the brand's colors, fonts, and styles to email components

2. **Smart Fallback System**
   ```javascript
   Try: Store Brand Settings from API
     ↓ (if fails)
   Fallback: SampleBrand.json
   ```

3. **Route Awareness**
   - Uses Next.js `useParams()` to get `storePublicId` from the URL
   - Works for any store: `/store/ABC1234/email-builder`, `/store/noSyAXf/email-builder`, etc.

## Files Modified

### `/app/store/[storePublicId]/email-builder/BrandContext.jsx`

**Key Changes:**
```javascript
// Added Next.js router
import { useParams } from 'next/navigation';

// Get store ID from URL
const params = useParams();
const storePublicId = params?.storePublicId;

// Fetch brand settings from store API
const response = await fetch(`/api/store/${storePublicId}/brand-settings`);
const data = await response.json();

if (data.success && data.brandSettings) {
  setSelectedBrand(data.brandSettings);
}
```

## How It Works

### 1. **User Visits Email Builder**
```
URL: http://localhost:3000/store/noSyAXf/email-builder
```

### 2. **BrandContext Loads**
- Extracts `noSyAXf` from URL
- Fetches `/api/store/noSyAXf/brand-settings`
- Loads brand configuration from MongoDB

### 3. **Brand Applied**
The brand's settings are automatically applied to:
- **Colors**: Primary, secondary, and alternate palettes
- **Typography**: Font families, sizes, weights
- **Buttons**: Styles, colors, border radius, padding
- **Layout**: Background colors, spacing

### 4. **BrandSelector Shows Store Brand**
The "Select Brand" dropdown displays:
- Brand name (`brandName` field)
- Brand tagline (`brandTagline` field)
- Color swatches (primary + secondary colors)

## Brand Settings Structure

The email builder uses these fields from your Brand model:

```javascript
{
  brandName: "Your Brand Name",
  brandTagline: "Your Brand Tagline",
  slug: "your-brand-slug",

  // Colors
  primaryColor: [{ hex: "#007bff", name: "Primary Blue" }],
  secondaryColors: [
    { hex: "#6c757d", name: "Gray" },
    { hex: "#28a745", name: "Green" }
  ],

  // Typography
  customFontFamily: "Inter",
  emailFallbackFont: "Arial",
  brandFontColor: "#2d3748",

  // Button Styles
  buttonBackgroundColor: "#007bff",
  buttonTextColor: "#ffffff",
  buttonBorderRadius: 4,
  buttonPadding: 12,

  // CSS Styles (generated from your visual settings)
  cssStyles: {
    colors: { ... },
    buttons: [ ... ],
    typography: { ... },
    emailOptimized: { ... }
  }
}
```

## Testing

### Test Brand Integration:

1. **Visit Email Builder**
   ```
   http://localhost:3000/store/noSyAXf/email-builder
   ```

2. **Check Console Logs**
   - Should see: "Loading brand data from /api/store/noSyAXf/brand-settings"
   - If found: Brand data loaded successfully
   - If not found: "No brand settings found, loading sample brand"

3. **Verify Brand Selector**
   - Click "Select Brand" button in header
   - Should show your store's brand name
   - Should display brand colors as swatches

4. **Test Components**
   - Add a button block → Should use brand button styles
   - Add text block → Should use brand fonts and colors
   - Add section → Should use brand background colors

## API Endpoint

### GET `/api/store/[storePublicId]/brand-settings`

**Response:**
```json
{
  "success": true,
  "brandSettings": {
    "_id": "...",
    "brandName": "Balmain",
    "brandTagline": "French Luxury Fashion",
    "primaryColor": [{ "hex": "#000000", "name": "Black" }],
    "secondaryColors": [...],
    "cssStyles": {...},
    // ... other brand fields
  }
}
```

**No Brand Found:**
```json
{
  "success": true,
  "brandSettings": null,
  "message": "No brand settings configured for this store"
}
```

## Benefits

✅ **Store-Specific Branding** - Each store has its own email builder brand
✅ **Automatic Syncing** - Changes to brand settings instantly reflect in email builder
✅ **Consistent Design** - Emails match your brand guidelines automatically
✅ **Multi-Store Support** - Different stores can have different brands
✅ **Fallback System** - Always has a working brand, even if none configured

## Next Steps

To create/edit brand settings for a store:

1. Navigate to the store's brand settings page
2. Configure colors, fonts, and styles
3. Save the brand settings
4. They'll automatically appear in the email builder!

## Troubleshooting

**Brand not loading?**
- Check if store has brand settings in MongoDB
- Verify `/api/store/[storePublicId]/brand-settings` returns data
- Check browser console for errors

**Using wrong brand?**
- Verify URL has correct `storePublicId`
- Brand settings are linked to `store_id` in database

**Need to reset to default?**
- Delete or deactivate store's brand settings
- Email builder will use `SampleBrand.json` as fallback

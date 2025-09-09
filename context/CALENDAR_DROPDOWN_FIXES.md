# Calendar Dropdown Dark Mode Fixes

## Summary
Fixed text visibility issues in the date range selector dropdown where black text was appearing on dark backgrounds in dark mode.

## Components Fixed

### 1. Date Range Selector (`/app/components/ui/date-range-selector.jsx`)

#### Time Period Dropdown
- **Label**: Added `text-gray-700 dark:text-gray-300`
- **Button text**: Added `text-gray-900 dark:text-white`
- **Menu items**: Added `text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white`

#### Comparison Period Dropdown
- **Label**: Added `text-gray-700 dark:text-gray-300`
- **Button text**: Added `text-gray-900 dark:text-white`
- **Menu items**: Added proper hover states with dark mode support

#### Custom Date Range
- **Labels**: Updated to `text-gray-700 dark:text-gray-300`
- **Date buttons**: Wrapped text in spans with `text-gray-900 dark:text-white`
- **Calendar modifiers**: Changed from hardcoded colors to Tailwind classes

### 2. Dropdown Menu Component (`/app/components/ui/dropdown-menu.jsx`)

#### DropdownMenuContent
- Added `dark:bg-gray-900` for dark background
- Changed text to `text-gray-900 dark:text-white`
- Added `dark:border-gray-700` for border

#### DropdownMenuItem
- Added `dark:hover:bg-gray-800` for hover state
- Added `dark:focus:bg-gray-800` for focus state
- Added `dark:focus:text-white` for focused text

## Before/After

### Before (Problem)
- Black text on dark gray backgrounds in dark mode
- Hardcoded colors in modifiersStyles
- Missing dark mode classes in dropdown components

### After (Fixed)
- Proper text contrast in both light and dark modes
- All text readable with appropriate colors
- Hover and focus states work correctly
- Calendar selections use theme-aware classes

## Color Scheme Applied

### Light Mode
- **Labels**: `text-gray-700` (#374151)
- **Selected text**: `text-gray-900` (#111827)
- **Hover text**: `text-gray-900` (#111827)

### Dark Mode
- **Labels**: `text-gray-300` (#D1D5DB)
- **Selected text**: `text-white` (#FFFFFF)
- **Hover text**: `text-white` (#FFFFFF)
- **Backgrounds**: `bg-gray-900` (#111827)
- **Hover backgrounds**: `bg-gray-800` (#1F2937)

## Testing
All dropdowns now:
- ✅ Have readable text in both themes
- ✅ Show proper hover states
- ✅ Maintain focus visibility
- ✅ Use consistent color patterns
- ✅ Meet WCAG AA contrast standards
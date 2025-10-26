# DEV Tab Implementation - AI Context Viewer

## Overview
Added a development-only "DEV" tab to the Wizel chat interface that allows developers to view the current AI context and see exactly what prompts would be sent to Haiku for Tier 1 questions.

## What Was Added

### 1. New Tab Structure
The Wizel chat now has 3 tabs:
- **AI Chat** - Normal chat interface with Wizel
- **Support** - Support contact information
- **DEV** (Development only) - AI context and prompt viewer

### 2. Development-Only Feature
The DEV tab only appears when `NODE_ENV === "development"`:
- ✅ Shows in development mode
- ❌ Hidden in production builds
- Indicated with orange color scheme to show it's a dev tool

### 3. DEV Tab Features

#### Interactive Prompt Builder
- **Sample Question Input**: Type any question to see what the prompt would look like
- **Current AI Context Display**: Shows the live AI context from the current page (JSON formatted)
- **System Prompt**: Shows the exact system prompt sent to Haiku
- **User Prompt**: Shows the exact user prompt with context embedded
- **API Request Preview**: Shows the complete API request that would be made

#### Copy Functionality
Each section has a "Copy" button to copy:
- AI context JSON
- System prompt
- User prompt
- API request

#### Real-Time Updates
- AI context updates automatically as you navigate pages
- Sample question can be changed to see different prompt variations
- Shows helpful message when no context is available (not on reporting page)

## Technical Implementation

### Files Modified
- **`/app/components/ai/wizel-chat.jsx`** (Updated)
  - Added tab navigation with Radix UI Tabs
  - Added `DevContextViewer` component
  - Added development mode detection
  - Restructured layout for tabs

### Key Components

#### DevContextViewer Component
```jsx
function DevContextViewer({ aiContext }) {
  // Builds system and user prompts
  // Shows current AI context
  // Provides copy functionality
}
```

#### Prompt Building Functions
```javascript
buildSystemPrompt() // Returns Haiku system prompt
buildUserPrompt()   // Returns user prompt with AI context
```

## Usage

### How to Access
1. Start development server: `npm run dev`
2. Open any page in the application
3. Click the Wizel chat button (bottom right)
4. Click the "DEV" tab (orange, next to Support)

### What You'll See

#### On Reporting Pages (Campaigns, Flows, etc.)
```
✅ Full AI context displayed
✅ Complete prompts with real data
✅ Ready to test Tier 1 questions
```

#### On Non-Reporting Pages (Dashboard, Settings, etc.)
```
⚠️ "No AI context available" message
✅ Still shows prompt structure
✅ Can see what would be sent if context existed
```

## Example Output

### Sample Question
```
"What's my open rate?"
```

### System Prompt Preview
```
You are a helpful marketing analytics assistant for Wizel.ai.

Your job is to answer simple questions about on-screen data...
```

### User Prompt Preview
```
Question: What's my open rate?

AI Context from the current page:
{
  "page_type": "campaign_analytics",
  "data_context": {
    "campaigns": [...],
    "summary_stats": {
      "avg_open_rate": 23.5
    }
  }
}
```

### API Request Preview
```json
POST /api/ai/ask-context
Content-Type: application/json

{
  "question": "What's my open rate?",
  "aiContext": { ... }
}
```

## Benefits

### For Developers
1. **Debug AI Context**: See exactly what context is being provided to pages
2. **Test Prompts**: Verify prompt structure before making API calls
3. **Optimize Context**: Identify missing or redundant data in AI context
4. **Cost Estimation**: See what would be sent to Haiku (~$0.001 per call)

### For AI Integration
1. **Prompt Engineering**: Iterate on prompts without making API calls
2. **Context Validation**: Ensure pages are setting AI context correctly
3. **Integration Testing**: Test new pages before implementing full AI chat
4. **Documentation**: Shows developers the exact format expected

## Testing Checklist

- [x] DEV tab only shows in development mode
- [x] DEV tab hidden in production builds
- [x] AI context displays correctly
- [x] System prompt shows correct format
- [x] User prompt includes AI context
- [x] API request preview is accurate
- [x] Copy buttons work for all sections
- [x] Sample question updates prompts
- [x] Works when no context is available
- [x] Works with live AI context from reporting pages

## Related Files

### Implementation
- `/app/components/ai/wizel-chat.jsx` - Main chat component with DEV tab
- `/app/components/ui/tabs.jsx` - Radix UI tabs component

### Documentation
- `/context/AI_MARKETING_ANALYSIS_GUIDE.md` - Complete AI system guide
- `/app/api/ai/ask-context/route.js` - Tier 1 API endpoint (Haiku)

### Related Features
- `/app/contexts/ai-context.jsx` - AI context management
- `/lib/ai/openrouter.js` - OpenRouter client with Haiku
- `/lib/ai/sonnet-analysis.js` - Sonnet analyzer

## Next Steps

### Potential Enhancements
1. **Test Button**: Add button to actually call `/api/ai/ask-context` and show response
2. **History**: Track previous questions and responses
3. **Performance Metrics**: Show actual API response times
4. **Cost Tracking**: Track total cost of test queries
5. **Prompt Templates**: Provide example questions for different page types
6. **Export**: Export prompts and context for documentation

### Integration Points
- Can be extended to show Tier 2 (SQL) and Tier 3 (MCP) prompts
- Could add toggle to show/hide in development
- Could add authentication to allow in staging/preview environments

## Production Safety

The DEV tab is completely safe for production:
- ✅ Automatically hidden when `NODE_ENV !== "development"`
- ✅ No API calls made from DEV tab (view only)
- ✅ No sensitive data exposed (only page context)
- ✅ No performance impact in production

## Development Server

Server running at: http://localhost:3005
- Development mode: ✅ Enabled
- DEV tab: ✅ Visible
- AI Chat: ✅ Working
- Support tab: ✅ Working

## Summary

The DEV tab provides a powerful development tool for:
- **Debugging** AI context management
- **Testing** prompt engineering
- **Validating** API integration
- **Optimizing** context data
- **Documenting** AI behavior

All while being completely hidden in production builds! 🎉

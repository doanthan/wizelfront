# Wizel AI Chat System

## Overview

The Wizel AI Chat is a powerful, context-aware AI assistant that can analyze on-screen data, query ClickHouse analytics, and present results as formatted tables and charts following your design system.

## Features

- 🎯 **Context-Aware**: Automatically accesses WIZEL_AI context from your reporting pages
- 📊 **Data Visualization**: Renders beautiful tables and charts using Recharts
- 🔒 **Permission-Based**: Only queries stores the user has access to
- ⚡ **ClickHouse Integration**: Fast analytics queries across all your tables
- 🎨 **Design System Compliant**: Follows `/context/design-principles.md` styling
- 💬 **Natural Language**: Ask questions in plain English

## Quick Start

### 1. Install Dependencies

```bash
npm install @anthropic-ai/sdk recharts
```

### 2. Add to Your Layout

```jsx
// app/(dashboard)/layout.jsx
import ChatProvider from '@/app/components/ai/chat-provider';

export default function DashboardLayout({ children }) {
  return (
    <div>
      <ChatProvider>
        {children}
      </ChatProvider>
    </div>
  );
}
```

### 3. Set Environment Variables

```bash
# .env.local
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 4. Update AI Context in Your Pages

```jsx
// In any reporting page
"use client";

import { useAI } from "@/app/contexts/ai-context";
import { useEffect } from "react";

export default function CampaignAnalyticsPage() {
  const { setAIState } = useAI();

  useEffect(() => {
    const WIZEL_AI = {
      page_type: "campaign_analytics",
      data_context: {
        campaigns: campaignData,
        date_range: { start: startDate, end: endDate },
        selected_stores: selectedStores
      },
      available_actions: ["compare", "export", "drill_down"]
    };

    setAIState(WIZEL_AI);

    return () => setAIState(null);
  }, [campaignData, startDate, endDate]);

  // Your page content...
}
```

## Slash Commands

The chat supports special commands for demonstrations:

### `/table` - Show Example Table

Displays a beautifully formatted table with:
- Gradient header (sky-blue to purple)
- Hover effects on rows
- Responsive design
- Dark mode support

Example output:
```
Campaign Name       | Recipients | Open Rate | Revenue
Black Friday Sale   | 15,234     | 45.2%     | $12,450
Welcome Series      | 8,421      | 52.1%     | $8,230
```

### `/chart` - Show Example Chart

Displays an interactive bar chart with:
- Recharts visualization
- Brand colors from design system
- Tooltips and legends
- Responsive container

Example: Weekly revenue and orders visualization

## Example Questions

### Campaign Performance
- "What's my best performing campaign this month?"
- "Show me campaigns with open rates above 40%"
- "Compare email vs SMS performance"
- "Which campaign generated the most revenue?"

### Revenue Analytics
- "Show me revenue trends for the last 30 days"
- "What's my total revenue this week?"
- "Compare revenue across my stores"

### Customer Insights
- "How many customers are in the Champions segment?"
- "Show me customer purchase patterns"
- "What's my repeat purchase rate?"

### Product Analytics
- "Which products drive the most repeat purchases?"
- "Show me top products by revenue"
- "What are my best-selling brands?"

## Data Visualization

### Automatic Table Generation

When the AI detects tabular data, it automatically formats it as a table:

```json
{
  "type": "table",
  "columns": ["Campaign", "Opens", "Clicks", "Revenue"],
  "rows": [
    ["Campaign 1", "1,234", "456", "$12,345"],
    ["Campaign 2", "2,345", "678", "$23,456"]
  ],
  "summary": "Top campaigns by revenue"
}
```

### Automatic Chart Generation

Time-series and metric data is visualized as charts:

```json
{
  "type": "chart",
  "chartType": "bar",
  "data": [
    { "name": "Mon", "revenue": 4200, "orders": 23 },
    { "name": "Tue", "revenue": 5800, "orders": 31 }
  ],
  "metrics": ["revenue", "orders"],
  "title": "Weekly Performance"
}
```

## ClickHouse Tables Available

The AI can query these ClickHouse tables:

1. **campaign_statistics** - Campaign performance (opens, clicks, revenue)
2. **flow_statistics** - Automated flow metrics
3. **account_metrics_daily** - Daily account aggregates
4. **customer_profiles** - RFM segments, customer analytics
5. **products_master** - Product catalog and performance
6. **klaviyo_orders** - Order transaction data
7. **segment_statistics** - Segment metrics
8. **form_statistics** - Form submission data
9. **brand_performance** - Brand analytics
10. **product_repurchase_stats** - Repeat purchase patterns

## Architecture

```
User Question
    ↓
Router (Claude Sonnet 4)
    ↓
┌─────────────┬──────────────────┬─────────────────┐
│ On-Screen   │ ClickHouse Query │ User Permissions│
│ Context     │ Tool             │ Tool            │
└─────────────┴──────────────────┴─────────────────┘
    ↓
Response Synthesizer
    ↓
┌──────────────┬────────────┐
│ Text Response│ Structured │
│              │ Data       │
│              │ (Table/    │
│              │  Chart)    │
└──────────────┴────────────┘
```

## Styling Guide

### Tables

Tables follow the design system with:
- **Header**: `bg-gradient-to-r from-sky-50 to-purple-50`
- **Text**: `text-gray-900 dark:text-gray-100` (high contrast)
- **Borders**: `border-gray-200 dark:border-gray-700`
- **Hover**: `hover:bg-gray-50 dark:hover:bg-gray-800`

### Charts

Charts use the brand color palette:
- Primary: `#60A5FA` (Sky Blue)
- Secondary: `#8B5CF6` (Vivid Violet)
- Success: `#34D399` (Emerald)
- Warning: `#FBBF24` (Amber)
- Danger: `#F87171` (Red)

### Chat Bubbles

- **User**: Gradient background `from-sky-blue to-vivid-violet`
- **Assistant**: `bg-gray-100 dark:bg-gray-800`
- **Error**: `bg-red-50 dark:bg-red-900/20`

## Security

### Permission Enforcement

The chat automatically:
1. ✅ Gets user's accessible stores from ContractSeat permissions
2. ✅ Validates requested stores against user permissions
3. ✅ Converts store_public_ids to klaviyo_public_ids for ClickHouse
4. ✅ Filters results to only show authorized data

### API Key Security

- Anthropic API key is server-side only
- Never exposed to client
- All queries validated through session authentication

## Performance

- **Response Time**: ~2-4 seconds for simple queries
- **Chart Rendering**: < 100ms using Recharts
- **Table Rendering**: Instant for up to 1000 rows
- **Context Loading**: Automatic and non-blocking

## Troubleshooting

### Chat Not Opening
- Check that `ChatProvider` is in your layout
- Verify `useAI` context is available

### No Data Returned
- Check ClickHouse connection in `/lib/clickhouse.js`
- Verify stores have valid `klaviyo_integration.public_id`
- Check user has ContractSeat permissions

### Incorrect Store Data
- Ensure WIZEL_AI context includes correct `store_public_ids`
- Verify store → klaviyo_public_id mapping in MongoDB

### Styling Issues
- Ensure Tailwind CSS is configured correctly
- Check dark mode classes are applied
- Verify design system colors in `tailwind.config.js`

## Advanced Usage

### Custom Tool Functions

Add new tools to `/lib/ai-agent/tools.js`:

```javascript
{
  name: "custom_analytics",
  description: "Your custom analytics tool",
  input_schema: {
    type: "object",
    properties: {
      metric: { type: "string" }
    }
  }
}
```

### Custom Visualizations

Extend `DataChart` component in `wizel-chat.jsx`:

```jsx
case 'pie':
  return (
    <PieChart>
      <Pie
        data={chartData}
        dataKey="value"
        nameKey="name"
        cx="50%"
        cy="50%"
      >
        {chartData.map((entry, index) => (
          <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
        ))}
      </Pie>
    </PieChart>
  );
```

## Future Enhancements

- [ ] Export tables to CSV
- [ ] Download charts as PNG
- [ ] Multi-turn conversations with memory
- [ ] Suggested follow-up questions
- [ ] Voice input support
- [ ] Real-time data streaming
- [ ] Custom chart configurations
- [ ] Scheduled reports via chat
- [ ] Integration with Slack/Teams

## Support

For issues or questions:
1. Check this README first
2. Review `/context/CLAUDE.md` for system architecture
3. Check `/context/design-principles.md` for styling
4. Review ClickHouse schema in `/context/click_house_Schema.csv`

## License

Internal use only - Wizel.ai platform

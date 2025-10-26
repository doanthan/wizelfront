# Campaign Details Modal - Feature Guide 🎯

## What's New?

You can now **click on any campaign** in the campaigns report table to view detailed information in a beautiful modal, just like in the calendar view!

---

## 📍 Location

**Page**: `/store/[storePublicId]/report/campaigns`  
**Example**: `http://localhost:3000/store/qk2boJR/report/campaigns`

---

## 🖱️ How to Use

### Step 1: Navigate to Campaigns Report
Go to any store's campaign report page.

### Step 2: Find a Campaign
Scroll through the campaigns table to find the campaign you want to inspect.

### Step 3: Click the Row
Click anywhere on the campaign row - the entire row is clickable!

**Visual Cue**: The row will show a gray background on hover, indicating it's clickable.

### Step 4: View Details
The modal opens showing:
- **Left Side**: Email preview (for email campaigns)
- **Right Side**: Detailed metrics and insights

### Step 5: Explore Tabs
For sent campaigns, you can switch between:
- **Overview**: Key metrics, engagement funnel, revenue
- **Deliverability**: Delivery health, bounce rates, spam reports

### Step 6: Close Modal
Click outside the modal or press `Esc` to close.

---

## 🎨 What You'll See

### Email Campaign Modal

```
┌────────────────────────────────────────────────────────────┐
│                    Campaign Details                         │
├──────────────────────┬─────────────────────────────────────┤
│                      │  ┌─────────────────────────────┐    │
│   EMAIL PREVIEW      │  │  Overview | Deliverability  │    │
│   ─────────────      │  └─────────────────────────────┘    │
│                      │                                      │
│   [Email HTML]       │  📊 Key Metrics:                    │
│   ───────────        │  👁️  Opens: 1,234 (45.2%)          │
│   Subject: ...       │  🖱️  Clicks: 567 (20.7%)           │
│   From: ...          │  💰 Revenue: $12,345               │
│   [Body content]     │  🎯 Conversions: 89 (3.2%)         │
│                      │                                      │
│   ┌───────────────┐  │  📈 Engagement Funnel:              │
│   │ Campaign Info │  │  ▓▓▓▓▓▓▓▓▓▓ Delivered (100%)       │
│   │ Black Friday  │  │  ▓▓▓▓▓░░░░░ Opened (45%)           │
│   │ Jan 15, 2025  │  │  ▓▓░░░░░░░░ Clicked (21%)          │
│   │ 📧 Email      │  │  ░░░░░░░░░░ Converted (3%)         │
│   │ 2.7K recip.   │  │                                      │
│   └───────────────┘  │  💡 Performance Summary             │
│                      │  Click-to-Open: 45.8%               │
│                      │  Revenue/Recipient: $4.53           │
│                      │  Delivery Health: 95/100 ✅         │
└──────────────────────┴─────────────────────────────────────┘
```

### SMS Campaign Modal

```
┌────────────────────────────────────────────────────────────┐
│                    Campaign Details                         │
├──────────────────────┬─────────────────────────────────────┤
│                      │  ┌─────────────────────────────┐    │
│   NO EMAIL PREVIEW   │  │  Overview | Deliverability  │    │
│   (SMS Campaign)     │  └─────────────────────────────┘    │
│                      │                                      │
│   ┌───────────────┐  │  📊 Key Metrics:                    │
│   │ Campaign Info │  │  📱 Delivered: 1,234 (99.8%)       │
│   │ Flash Sale    │  │  🖱️  Clicks: 234 (18.9%)           │
│   │ Jan 15, 2025  │  │  💰 Revenue: $5,678                │
│   │ 💬 SMS        │  │  🎯 Conversions: 45 (3.6%)         │
│   │ 1.2K recip.   │  │                                      │
│   └───────────────┘  │  📈 SMS Engagement:                 │
│                      │  ▓▓▓▓▓▓▓▓▓▓ Delivered (100%)       │
│                      │  ▓▓░░░░░░░░ Clicked (19%)          │
│                      │  ░░░░░░░░░░ Converted (4%)         │
│                      │                                      │
│                      │  💡 Performance Summary             │
│                      │  Click-to-Delivery: 18.9%           │
│                      │  Revenue/Recipient: $4.73           │
│                      │  SMS Health: 98/100 ✅              │
└──────────────────────┴─────────────────────────────────────┘
```

---

## 📊 Metrics Explained

### Overview Tab:
- **Opens**: Unique opens (email only)
- **Clicks**: Unique clicks on links
- **Revenue**: Total revenue attributed to campaign
- **Conversions**: Number of orders placed
- **CTOR**: Click-to-Open Rate (email) or Click-to-Delivery Rate (SMS)
- **Revenue per Recipient**: Average revenue per person

### Deliverability Tab:
- **Recipients**: Total people targeted
- **Delivered**: Successfully delivered messages
- **Bounced**: Failed deliveries
- **Spam Reports**: Messages marked as spam
- **Unsubscribes**: People who opted out
- **Health Score**: 0-100 rating based on delivery metrics

---

## 🎯 Tips & Tricks

### Quick Actions:
- **Esc Key**: Closes the modal instantly
- **Click Outside**: Closes the modal
- **Tab Switching**: Click Overview/Deliverability tabs to switch views

### Best Practices:
1. **Check Deliverability First** for campaigns with low engagement
2. **Compare CTOR** across campaigns to identify content quality
3. **Review Health Score** to spot deliverability issues
4. **Use Email Preview** to verify rendering before scheduling

### Troubleshooting:
- **No Email Preview?**: Campaign may not have a message_id or HTML content
- **Missing Metrics?**: Campaign may be scheduled (not sent yet)
- **"No Data"**: Campaign may be too old or not synced from Klaviyo

---

## 🚀 Benefits

1. **Fast Access**: No need to navigate to Klaviyo
2. **Complete View**: See all metrics in one place
3. **Visual Preview**: Verify email rendering
4. **Quick Comparison**: Click through multiple campaigns easily
5. **Deliverability Insights**: Identify issues quickly
6. **Dark Mode**: Works in both light and dark themes

---

## 🎨 Visual Indicators

- **✅ Green**: Excellent metrics (>90 health score)
- **🟡 Yellow**: Fair metrics (60-89 health score)
- **🔴 Red**: Needs attention (<60 health score)
- **📧 Blue Icon**: Email campaign
- **💬 Green Icon**: SMS campaign
- **🎯 Badges**: Quick status indicators

---

## ❓ FAQ

**Q: Can I edit the campaign from the modal?**  
A: Not yet - this is view-only. Use Klaviyo for editing.

**Q: Can I export the data?**  
A: Not yet - coming in a future update!

**Q: Why don't I see an email preview?**  
A: SMS campaigns don't have email previews, and some email campaigns may not have the message data available.

**Q: Can I compare multiple campaigns?**  
A: Not yet - currently shows one campaign at a time.

**Q: Does this work on mobile?**  
A: Yes! The modal is fully responsive.

---

## 🔗 Related Features

- **Calendar View**: Similar modal used in `/calendar`
- **Campaign Filtering**: Filter campaigns before viewing details
- **Campaign Sorting**: Sort by any metric column
- **Search**: Search campaigns by name

---

**Enjoy exploring your campaign data! 🎉**

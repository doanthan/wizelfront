# Trial Request Form Setup Guide

## ✅ What's Been Created

### 1. **Lead Generation Form** (`/request-trial`)
- Beautiful branded form for trial requests
- Collects: Name, Email, Company, Phone, Email Volume, Current Platform, Message
- Shows benefits and trust signals
- Mobile-responsive design

### 2. **API Endpoint** (`/api/trial-request`)
- Saves all trial requests to MongoDB (`trialrequests` collection)
- Validates email format
- Returns success/error responses
- Admin GET endpoint to view all requests

### 3. **Calendar Integration Ready**
After form submission, it shows a calendar booking page (currently placeholder)

## 🔧 Setup Calendar Integration

### Option A: Calendly (Recommended)

1. **Get Your Calendly Link**
   - Go to https://calendly.com
   - Create a meeting type (e.g., "Trial Demo - 30 min")
   - Copy your scheduling link

2. **Update the Form**
   Edit `/app/request-trial/page.jsx` line ~172:

   ```javascript
   // Replace this:
   src="https://calendly.com/your-calendly-link?embed_domain=wizel.ai&embed_type=Inline"

   // With your actual link:
   src="https://calendly.com/YOUR-USERNAME/trial-demo?embed_domain=wizel.ai&embed_type=Inline"
   ```

3. **Remove Placeholder Text**
   Delete or comment out lines ~181-194 (the placeholder div)

### Option B: Cal.com (Open Source Alternative)

1. **Get Your Cal.com Link**
   - Go to https://cal.com
   - Create an event type
   - Copy your booking link

2. **Update the Form**
   Edit `/app/request-trial/page.jsx` line ~175:

   ```javascript
   // Uncomment and update this:
   <iframe
     src="https://cal.com/YOUR-USERNAME/15min"
     width="100%"
     height="100%"
     frameBorder="0"
     className="rounded-lg"
   />
   ```

3. **Remove Placeholder**
   Delete the placeholder div (lines ~181-194)

## 📊 View Trial Requests

### In MongoDB
All requests are saved in the `trialrequests` collection:

```javascript
{
  "_id": ObjectId,
  "name": "John Doe",
  "email": "john@company.com",
  "company": "ACME Corp",
  "phone": "+1 555-123-4567",
  "monthlyEmailVolume": "100,000",
  "currentPlatform": "Klaviyo",
  "message": "Looking to scale our email marketing",
  "status": "pending",
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

### Via API
GET `/api/trial-request` to retrieve all requests (add auth later):

```bash
# Get all trial requests
curl http://localhost:3001/api/trial-request

# Filter by status
curl http://localhost:3001/api/trial-request?status=pending

# Limit results
curl http://localhost:3001/api/trial-request?limit=10
```

## 🔔 Email Notifications (TODO)

Add email notifications when a trial is requested:

### 1. **To Sales Team**
Edit `/app/api/trial-request/route.js` after line 60:

```javascript
// Send notification to sales team
await sendEmail({
  to: 'sales@wizel.ai',
  subject: `New Trial Request from ${company}`,
  html: `
    <h2>New Trial Request</h2>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Company:</strong> ${company}</p>
    <p><strong>Phone:</strong> ${phone}</p>
    <p><strong>Monthly Volume:</strong> ${monthlyEmailVolume}</p>
    <p><strong>Current Platform:</strong> ${currentPlatform}</p>
    <p><strong>Message:</strong> ${message}</p>
  `
});
```

### 2. **To Requester (Confirmation)**
```javascript
// Send confirmation to requester
await sendEmail({
  to: email,
  subject: 'Thanks for your interest in Wizel.ai!',
  html: `
    <h2>Hi ${name},</h2>
    <p>We've received your trial request and will be in touch within 24 hours.</p>
    <p>In the meantime, feel free to explore our resources...</p>
  `
});
```

Use your existing Resend integration from `/lib/email.js`

## 🎨 Customization

### Update Form Fields
Edit `/app/request-trial/page.jsx` to add/remove fields:

```javascript
const [formData, setFormData] = useState({
  name: "",
  email: "",
  company: "",
  // Add more fields here
  industry: "",
  teamSize: "",
  // etc.
});
```

### Update Benefits List
Edit lines ~76-100 in `/app/request-trial/page.jsx`:

```javascript
<div className="flex items-center gap-2">
  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
  <span className="text-sm">Your custom benefit here</span>
</div>
```

## 🔐 Security Recommendations

### 1. Add Rate Limiting
Prevent spam by limiting form submissions:

```javascript
// In /app/api/trial-request/route.js
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3 // limit each IP to 3 requests per windowMs
});
```

### 2. Add CAPTCHA
Integrate reCAPTCHA or hCaptcha:

```bash
npm install react-google-recaptcha
```

### 3. Email Verification
Consider requiring email verification before showing calendar

## 📈 Tracking & Analytics

### Add Google Analytics Event
In `/app/request-trial/page.jsx` after successful submission:

```javascript
// Track trial request
if (typeof window !== 'undefined' && window.gtag) {
  window.gtag('event', 'trial_request', {
    event_category: 'lead_generation',
    event_label: formData.company,
    value: 1
  });
}
```

### Track in CRM
Integrate with your CRM (HubSpot, Salesforce, etc.) in the API endpoint

## 🧪 Testing

1. **Test Form Submission**
   - Go to http://localhost:3001/request-trial
   - Fill out and submit the form
   - Check MongoDB for the new entry
   - Verify calendar page shows

2. **Test Validation**
   - Try submitting with invalid email
   - Try submitting with missing required fields
   - Check error messages display correctly

3. **Test Responsive Design**
   - Test on mobile devices
   - Test on tablets
   - Test on desktop

## 🚀 Going Live

1. ✅ Add your Calendly/Cal.com link
2. ✅ Remove placeholder text
3. ✅ Add email notifications
4. ✅ Add rate limiting
5. ✅ Add CAPTCHA (optional but recommended)
6. ✅ Test thoroughly
7. ✅ Update privacy policy to include trial request data
8. ✅ Add Google Analytics tracking

## 📝 Current Flow

```
User Journey:
1. User clicks "Request Free 14-Day Trial" button
2. Redirected to /request-trial
3. Sees benefits and trust signals
4. Fills out lead form
5. Submits form → Saved to MongoDB
6. Shows calendar booking page
7. User schedules demo
8. Sales team gets notified
9. Demo happens → Trial activated
```

## 🎯 Next Steps

- [ ] Add your calendar link (Calendly or Cal.com)
- [ ] Set up email notifications with Resend
- [ ] Add CAPTCHA protection
- [ ] Connect to your CRM
- [ ] Add Google Analytics tracking
- [ ] Test the complete flow
- [ ] Remove placeholder calendar text

---

**Need help?** Check the comments in `/app/request-trial/page.jsx` for inline instructions!

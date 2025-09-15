# Toast System Documentation
**How "Klaviyo has been connected" toast notifications work**

---

## 🍞 Overview

The toast system in Wizel is built on **Radix UI Toast primitives** with a custom React hook for state management. When you connect Klaviyo, a success toast appears in the **bottom-right corner** saying "Connected Successfully" with the description "Klaviyo has been connected to your store".

---

## 🏗️ Architecture

### **Components Involved**

```
Klaviyo Connect Page
      ↓ (success)
useToast Hook
      ↓ (dispatch)
Toast Reducer
      ↓ (state)
Toaster Component
      ↓ (render)
Toast UI Component
      ↓ (display)
Bottom-right notification
```

---

## 📁 File Structure

| File | Purpose | Key Features |
|------|---------|--------------|
| **`/app/hooks/use-toast.js`** | Toast state management | Reducer, dispatch, memory state |
| **`/app/components/ui/toast.jsx`** | Toast UI primitives | Radix UI wrapper, variants |
| **`/app/components/ui/toaster.jsx`** | Toast renderer | Maps state to components |
| **`/app/(dashboard)/store/[id]/klaviyo-connect/page.jsx`** | Triggers toast | Calls toast on success |

---

## 🔧 Implementation Details

### **1. Toast Trigger - Klaviyo Connection Success**

**File**: `/app/(dashboard)/store/[storePublicId]/klaviyo-connect/page.jsx`

```javascript
// Lines 287-290: The exact toast that appears when Klaviyo connects
toast({
    title: "Connected Successfully",
    description: "Klaviyo has been connected to your store",
});
```

**Flow**: When `handleSaveConnection()` receives a successful response from the API, this toast is triggered.

### **2. Toast Hook - State Management**

**File**: `/app/hooks/use-toast.js`

```javascript
// Core configuration
const TOAST_LIMIT = 1;                    // Only 1 toast at a time
const TOAST_REMOVE_DELAY = 1000000;       // Very long delay (16+ minutes)

// Toast creation function
function toast({ ...props }) {
  const id = genId();                     // Generate unique ID
  
  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      ...props,
      id,
      open: true,                         // Starts visible
      onOpenChange: (open) => {
        if (!open) dismiss();             // Auto-dismiss when closed
      },
    },
  });
  
  return { id, dismiss, update };         // Return control functions
}
```

**Key Features**:
- **Global State**: Uses memory state shared across components
- **Reducer Pattern**: Redux-style state management
- **Auto-dismiss**: Closes when user interacts with close button
- **Single Toast**: Only shows 1 toast at a time (replaces previous)

### **3. Toast UI Components - Visual Design**

**File**: `/app/components/ui/toast.jsx`

```javascript
// Toast positioning - bottom-right on desktop
const ToastViewport = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      //        ↑ Mobile: top    ↑ Desktop: bottom-right
      className
    )}
    {...props}
  />
));

// Toast variants - different styles
const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-lg border p-4 pr-6 shadow-lg transition-all...",
  {
    variants: {
      default: "border-neutral-gray bg-white text-slate-gray",
      destructive: "destructive group border-red-600/20 bg-red-600 text-white",
      success: "border-green-500/20 bg-green-500 text-white",
      info: "border-sky-blue/20 bg-sky-blue text-white",
      gradient: "border-vivid-violet/20 bg-gradient-to-r from-sky-blue to-vivid-violet text-white",
    },
  }
);
```

**Visual Features**:
- **Positioning**: Bottom-right on desktop, top on mobile
- **Animation**: Slide in from bottom, fade out
- **Styling**: White background, gray border, shadow
- **Responsive**: Max width 420px on larger screens
- **Z-index**: 100 (appears above most content)

### **4. Toast Renderer - Component Management**

**File**: `/app/components/ui/toaster.jsx`

```javascript
export function Toaster() {
  const { toasts } = useToast();           // Get current toasts from hook

  return (
    <ToastProvider>                        {/* Radix Toast context */}
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>      {/* Individual toast */}
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}                       {/* Optional action button */}
            <ToastClose />                {/* X close button */}
          </Toast>
        );
      })}
      <ToastViewport />                   {/* Positioned container */}
    </ToastProvider>
  );
}
```

**Key Functions**:
- **Maps State to UI**: Renders each toast in the state array
- **Provides Context**: Radix Toast provider for accessibility
- **Handles Layout**: Title, description, action, close button
- **Viewport**: Fixed positioning container

---

## 🎯 Klaviyo Connection Flow

### **Step-by-Step Process**

1. **User Action**: User clicks "Save & Start Sync" button
2. **API Call**: `handleSaveConnection()` makes POST to `/api/store/[id]/klaviyo-connect`
3. **Server Success**: API returns `{ success: true, message: "Klaviyo connected successfully" }`
4. **Toast Trigger**: Client calls `toast()` with success message
5. **State Update**: Toast hook dispatches ADD_TOAST action
6. **Component Render**: Toaster component renders new toast
7. **Animation**: Toast slides in from bottom-right
8. **User Sees**: "Connected Successfully" toast appears
9. **Auto-sync**: Additional API call to start data sync (also shows toast)

### **Complete Code Path**

```javascript
// 1. User clicks button (page.jsx:671-684)
<Button onClick={handleSaveConnection}>
  Save & Start Sync
</Button>

// 2. Handler makes API call (page.jsx:259-322)
const handleSaveConnection = async () => {
  const response = await fetch(`/api/store/${storePublicId}/klaviyo-connect`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  
  if (response.ok && data.success) {
    // 3. Success toast triggered (page.jsx:287-290)
    toast({
      title: "Connected Successfully",
      description: "Klaviyo has been connected to your store",
    });
  }
}

// 4. Toast hook processes (use-toast.js:104-131)
function toast({ ...props }) {
  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: { ...props, id, open: true },
  });
}

// 5. Reducer updates state (use-toast.js:40-91)
case actionTypes.ADD_TOAST:
  return {
    ...state,
    toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
  };

// 6. Toaster renders (toaster.jsx:13-35)
export function Toaster() {
  const { toasts } = useToast();
  return (
    <ToastProvider>
      {toasts.map(toast => <Toast {...toast} />)}
    </ToastProvider>
  );
}
```

---

## 🎨 Visual Design

### **Toast Appearance**

```css
/* Default toast styling from toast.jsx */
.toast-default {
  /* Position */
  position: fixed;
  bottom: 16px;        /* 4 * 0.25rem */
  right: 16px;         /* 4 * 0.25rem */
  z-index: 100;
  
  /* Layout */
  width: 100%;
  max-width: 420px;    /* md:max-w-[420px] */
  padding: 16px 24px 16px 16px;  /* p-4 pr-6 */
  
  /* Styling */
  background: white;
  border: 1px solid #6b7280;     /* border-neutral-gray */
  border-radius: 8px;            /* rounded-lg */
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 
              0 4px 6px -2px rgba(0, 0, 0, 0.05);  /* shadow-lg */
  
  /* Animation */
  transition: all 150ms ease-in-out;
  animation: slide-in-from-bottom 150ms ease-out;
}

/* Close button positioning */
.toast-close {
  position: absolute;
  top: 4px;           /* top-1 */
  right: 4px;         /* right-1 */
  opacity: 0;         /* Hidden by default */
  transition: opacity 150ms;
}

.toast:hover .toast-close {
  opacity: 1;         /* Show on hover */
}
```

### **Typography**

```css
/* Toast title */
.toast-title {
  font-size: 14px;        /* text-sm */
  font-weight: 600;       /* font-semibold */
  color: #1e293b;         /* text-slate-gray */
}

/* Toast description */
.toast-description {
  font-size: 14px;        /* text-sm */
  opacity: 0.9;           /* opacity-90 */
  color: #1e293b;         /* inherits from title */
  margin-top: 4px;        /* gap-1 in grid */
}
```

---

## 📱 Responsive Behavior

### **Desktop (md and up)**
- **Position**: Fixed bottom-right
- **Max Width**: 420px  
- **Padding**: 16px from edges
- **Animation**: Slides in from bottom

### **Mobile (sm and below)**
- **Position**: Fixed top-center
- **Width**: Full width minus padding
- **Padding**: 16px from edges  
- **Animation**: Slides in from top

### **CSS Breakdown**

```css
/* Mobile-first approach */
.toast-viewport {
  /* Mobile: top positioning */
  position: fixed;
  top: 0;
  flex-direction: column-reverse;  /* Newest on top */
  
  /* Desktop overrides */
  @media (min-width: 640px) {
    bottom: 0;
    right: 0;  
    top: auto;                     /* Remove top positioning */
    flex-direction: column;        /* Newest on bottom */
  }
}
```

---

## 🔄 State Management Deep Dive

### **Toast State Shape**

```javascript
// Memory state structure
memoryState = {
  toasts: [
    {
      id: "1",                           // Unique identifier
      title: "Connected Successfully",    // Main message
      description: "Klaviyo has been connected to your store",
      open: true,                        // Visibility state
      variant: "default",                // Styling variant
      onOpenChange: Function,            // Close handler
    }
  ]
}
```

### **Action Types**

```javascript
const actionTypes = {
  ADD_TOAST: "ADD_TOAST",           // Create new toast
  UPDATE_TOAST: "UPDATE_TOAST",     // Modify existing toast
  DISMISS_TOAST: "DISMISS_TOAST",   // Start close animation
  REMOVE_TOAST: "REMOVE_TOAST",     // Remove from state
};
```

### **Lifecycle Events**

1. **ADD_TOAST**: Toast created and added to state
2. **Component Mount**: Toast rendered with `open: true`
3. **Animation In**: Slide/fade in animation plays
4. **User Interaction**: User can dismiss or wait for timeout
5. **DISMISS_TOAST**: Close animation starts, `open: false`
6. **REMOVE_TOAST**: After delay, removed from state array
7. **Component Unmount**: Toast no longer rendered

---

## 🎛️ Configuration Options

### **Toast Limits**

```javascript
// use-toast.js configuration
const TOAST_LIMIT = 1;                    // Only 1 toast visible
const TOAST_REMOVE_DELAY = 1000000;       // ~16 minutes before auto-removal
```

### **Available Variants**

```javascript
// From toast.jsx
variants: {
  default: "border-neutral-gray bg-white text-slate-gray",           // Standard
  destructive: "border-red-600/20 bg-red-600 text-white",          // Errors
  success: "border-green-500/20 bg-green-500 text-white",          // Success
  info: "border-sky-blue/20 bg-sky-blue text-white",               // Information
  gradient: "bg-gradient-to-r from-sky-blue to-vivid-violet text-white", // Special
}
```

### **Usage Examples**

```javascript
// Default toast (what Klaviyo uses)
toast({
  title: "Connected Successfully",
  description: "Klaviyo has been connected to your store"
});

// Success toast
toast({
  title: "Success!",
  description: "Action completed successfully",
  variant: "success"
});

// Error toast
toast({
  title: "Error",
  description: "Something went wrong",
  variant: "destructive"
});

// Toast with action button
toast({
  title: "Update Available",
  description: "A new version is ready to install",
  action: <Button onClick={handleUpdate}>Update Now</Button>
});
```

---

## 🔍 Where Toaster is Rendered

### **Current Implementation**

The `Toaster` component is **only rendered** in specific layouts:

1. **Email Builder**: `/app/store/[storePublicId]/email-builder/layout.jsx`
2. **Showcase Page**: `/app/showcase/page.jsx`

### **Missing from Dashboard**

**IMPORTANT**: The main dashboard layout (`/app/(dashboard)/layout.jsx`) does **NOT** include the Toaster component. This means toasts will only work in:
- Email builder pages
- Showcase page

### **Fix Required**

To make the Klaviyo connection toast work throughout the dashboard, add to `/app/(dashboard)/layout.jsx`:

```javascript
// Add import
import { Toaster } from "@/app/components/ui/toaster";

// Add to JSX
<div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
  <Sidebar />
  <main className={`flex-1 p-4 lg:p-6 flex flex-col transition-all duration-300 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
    {children}
  </main>
  <ChatWidget />
  <Toaster />  {/* Add this line */}
</div>
```

---

## 🐛 Troubleshooting

### **Common Issues**

1. **Toast Not Appearing**
   - Check if `Toaster` component is rendered in the layout
   - Verify toast hook is called correctly
   - Check browser console for errors

2. **Toast Appears in Wrong Position**
   - Check CSS viewport classes
   - Verify responsive breakpoints
   - Check z-index conflicts

3. **Toast Won't Dismiss**
   - Check if close button is rendered
   - Verify onOpenChange handler
   - Check for JavaScript errors blocking events

### **Debug Steps**

```javascript
// Add to component for debugging
const { toasts } = useToast();
console.log('Current toasts:', toasts);

// Check if toast function works
toast({
  title: "Debug Toast",
  description: "Testing toast functionality"
});
```

---

## 🎯 Best Practices

### **Toast Usage Guidelines**

1. **Keep Messages Short**: Title should be 2-4 words, description 1-2 lines
2. **Use Appropriate Variants**: Match variant to action type
3. **Don't Overwhelm**: Limit to important notifications only
4. **Provide Context**: Include relevant details in description
5. **Consider Timing**: Important messages can have longer delays

### **Klaviyo-Specific Toasts**

```javascript
// Connection success
toast({
  title: "Connected Successfully",
  description: "Klaviyo has been connected to your store"
});

// Sync started
toast({
  title: "Sync Started", 
  description: "Initial data sync has been started"
});

// Disconnection
toast({
  title: "Disconnected",
  description: "Klaviyo has been disconnected from your store"
});

// Connection errors
toast({
  title: "Connection Failed",
  description: data.error || "Invalid API key",
  variant: "destructive"
});
```

---

## 📚 References

- **Radix UI Toast**: https://www.radix-ui.com/primitives/docs/components/toast
- **Class Variance Authority**: https://cva.style/docs  
- **Tailwind CSS**: https://tailwindcss.com/docs
- **React Hook Pattern**: Standard React patterns for state management

---

*Last Updated: December 2024*  
*Version: 1.0.0*  
*Component Status: Active*
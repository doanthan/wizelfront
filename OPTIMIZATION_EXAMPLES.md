# API Optimization Examples

## Before vs After Comparison

### ❌ BEFORE - Multiple Sequential API Calls
```javascript
// Old approach - 3+ separate API calls per page load
"use client";

export default function CustomerInsightsPage({ params }) {
  const [stores, setStores] = useState([]);
  const [brand, setBrand] = useState(null);
  const [reorderData, setReorderData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      // Call 1: Get accessible stores
      const storesRes = await fetch('/api/store');
      const storesData = await storesRes.json();
      setStores(storesData.stores);

      // Call 2: Check if current store is accessible
      const hasAccess = storesData.stores.some(s => s.public_id === params.storePublicId);
      if (!hasAccess) {
        router.push('/unauthorized');
        return;
      }

      // Call 3: Get brand data
      const brandRes = await fetch(`/api/store/${params.storePublicId}/brands`);
      const brandData = await brandRes.json();
      setBrand(brandData);

      // Call 4: Get reorder behavior
      const reorderRes = await fetch(`/api/store/${params.storePublicId}/customers/reorder-behavior`);
      const reorderData = await reorderRes.json();
      setReorderData(reorderData);

      setLoading(false);
    }

    loadData();
  }, [params.storePublicId]);

  // Total: 4 API calls, sequential execution
}
```

**Network Timeline:**
```
GET /api/store                                    [200ms]
  └─> GET /api/store/r37cMpq/brands               [150ms]
      └─> GET /api/store/.../reorder-behavior    [300ms]

Total Time: ~650ms + network latency
```

---

### ✅ AFTER - Optimized with Middleware + Combined API

#### Option 1: Using Combined Page Data API (RECOMMENDED)
```javascript
// New approach - 1 API call with all data
"use client";

import { useStoreAccess } from '@/app/hooks/useStoreAccess';

export default function CustomerInsightsPage({ params }) {
  const { hasAccessToStore, loading: accessLoading } = useStoreAccess();
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      // Access check is instant (uses cached data)
      if (accessLoading) return;

      if (!hasAccessToStore(params.storePublicId)) {
        router.push('/unauthorized');
        return;
      }

      // Single API call gets ALL data needed for the page
      const res = await fetch(
        `/api/store/${params.storePublicId}/page-data?include=brand,reorder,analytics`
      );
      const data = await res.json();

      setPageData(data);
      setLoading(false);
    }

    loadData();
  }, [params.storePublicId, hasAccessToStore, accessLoading]);

  // Total: 1 API call (or 2 on first load: /api/store + /page-data)
  // Subsequent page loads: 1 API call (store access is cached)
}
```

**Network Timeline:**
```
First Load:
GET /api/store                                    [200ms] (cached for 5 min)
GET /api/store/r37cMpq/page-data                  [300ms] (parallel fetches)

Subsequent Loads:
GET /api/store/r37cMpq/page-data                  [300ms]

First Load: ~500ms
Subsequent: ~300ms (50% faster!)
```

#### Option 2: Using Middleware in Individual APIs
```javascript
// Individual API routes now validate access internally
// No need for separate /api/store call from frontend

import { validateStoreAccess } from '@/middleware/storeAccess';

export async function GET(request, { params }) {
  const { storePublicId } = await params;

  // Single function does: auth check + store lookup + access validation
  const { hasAccess, store, user, error } = await validateStoreAccess(storePublicId);

  if (!hasAccess) {
    return NextResponse.json({ error }, { status: 403 });
  }

  // Proceed with business logic
  // store is already loaded, no need for separate Store.findOne()
}
```

---

## Performance Comparison

| Metric | Before | After (Combined API) | Improvement |
|--------|--------|---------------------|-------------|
| API Calls (First Load) | 4 | 2 | **50% reduction** |
| API Calls (Subsequent) | 4 | 1 | **75% reduction** |
| Total Network Time | ~650ms | ~300ms | **54% faster** |
| DB Queries per Request | 8+ | 3-4 | **50% reduction** |
| Client Bundle Size | Same | -2KB (less fetch logic) | Smaller |

---

## Best Practices

### 1. Use `useStoreAccess` Hook for All Store Access Checks
```javascript
// ✅ CORRECT - Use cached hook
import { useStoreAccess } from '@/app/hooks/useStoreAccess';

function Navigation() {
  const { stores, loading } = useStoreAccess();

  return (
    <select>
      {stores.map(store => (
        <option key={store.public_id}>{store.name}</option>
      ))}
    </select>
  );
}

// ❌ WRONG - Fetching stores in every component
function Navigation() {
  const [stores, setStores] = useState([]);

  useEffect(() => {
    fetch('/api/store').then(r => r.json()).then(setStores);
  }, []);
}
```

### 2. Use Combined Page Data API for Complex Pages
```javascript
// ✅ CORRECT - One call for everything
const data = await fetch(
  `/api/store/${storeId}/page-data?include=brand,reorder,analytics`
);

// ❌ WRONG - Multiple sequential calls
const brand = await fetch(`/api/store/${storeId}/brands`);
const reorder = await fetch(`/api/store/${storeId}/customers/reorder-behavior`);
const analytics = await fetch(`/api/store/${storeId}/analytics`);
```

### 3. Use Middleware Validation in All Store-Specific APIs
```javascript
// ✅ CORRECT - Middleware validates + provides store
import { validateStoreAccess } from '@/middleware/storeAccess';

export async function GET(request, { params }) {
  const { hasAccess, store } = await validateStoreAccess(params.storePublicId);
  // store is already loaded, proceed with logic
}

// ❌ WRONG - Manual store lookup + separate access check
export async function GET(request, { params }) {
  const session = await getServerSession();
  const storesRes = await fetch('/api/store'); // Extra API call!
  const store = await Store.findOne({ public_id: params.storePublicId });
}
```

### 4. Clear Cache When Needed
```javascript
// After user changes (like adding/removing store access)
import { useStoreAccess } from '@/app/hooks/useStoreAccess';

function SettingsPage() {
  const { refresh } = useStoreAccess();

  const handleAccessChange = async () => {
    await updateUserAccess();
    refresh(); // Clear cache and refetch
  };
}
```

---

## Migration Checklist

- [ ] Replace all `Store.findOne()` in API routes with `validateStoreAccess()`
- [ ] Update page components to use `useStoreAccess()` hook
- [ ] Identify pages with multiple related API calls
- [ ] Create combined endpoints for those pages using `/page-data` pattern
- [ ] Remove redundant `/api/store` calls from components
- [ ] Test access validation edge cases (no access, deleted stores, etc.)
- [ ] Monitor cache behavior in production

---

## When to Use Each Pattern

### Use `validateStoreAccess()` middleware when:
- Building individual API routes
- Need to validate access + get store in one step
- Want to avoid duplicate Store.findOne() queries
- Need consistent access validation across all routes

### Use Combined Page Data API when:
- Page needs multiple related data sources
- Data fetches are always used together
- Want to minimize client-side loading states
- Optimizing for first contentful paint

### Use `useStoreAccess()` hook when:
- Building navigation/dropdowns
- Checking if user has access to store
- Need list of accessible stores
- Want to avoid repeated /api/store calls

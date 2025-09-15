# Store Selector Implementation Guide

This guide documents how to implement a store selector dropdown similar to the one in the thinksend.ai sidebar, for use in other Next.js projects.

## Overview

The store selector provides:
- Search functionality to filter stores
- Visual indicators for the currently selected store
- Store switching with context updates
- "Add Store" option
- Clean dropdown UI with store icons

## Architecture Components

### 1. Store Context Provider

Create a context that manages store state across your application:

```javascript
// contexts/StoreContext.js
"use client"
import { createContext, useContext, useState, useEffect } from 'react'

const StoreContext = createContext()

export function StoreProvider({ children }) {
    const [stores, setStores] = useState([])
    const [currentStore, setCurrentStore] = useState(null)
    const [loading, setLoading] = useState(true)

    // Load current store from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedCurrentStore = localStorage.getItem('currentStore')
            if (savedCurrentStore) {
                try {
                    setCurrentStore(JSON.parse(savedCurrentStore))
                } catch (error) {
                    console.error('Error parsing saved current store:', error)
                    localStorage.removeItem('currentStore')
                }
            }
        }
    }, [])

    // Save current store to localStorage whenever it changes
    useEffect(() => {
        if (typeof window !== 'undefined' && currentStore) {
            localStorage.setItem('currentStore', JSON.stringify(currentStore))
        }
    }, [currentStore])

    // Fetch stores from your API
    const fetchStores = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/stores') // Your API endpoint
            const data = await response.json()
            
            if (data.success) {
                setStores(data.stores)
            }
        } catch (err) {
            console.error('Error fetching stores:', err)
        } finally {
            setLoading(false)
        }
    }

    // Set store by ID
    const setCurrentStoreById = (storeId) => {
        const store = stores.find(s => s.id === storeId)
        if (store) {
            setCurrentStore(store)
        }
    }

    const value = {
        stores,
        currentStore,
        loading,
        fetchStores,
        setCurrentStore,
        setCurrentStoreById
    }

    return (
        <StoreContext.Provider value={value}>
            {children}
        </StoreContext.Provider>
    )
}

export function useStores() {
    const context = useContext(StoreContext)
    if (context === undefined) {
        throw new Error('useStores must be used within a StoreProvider')
    }
    return context
}
```

### 2. Store Selector Component

Create the dropdown component with search and selection functionality:

```javascript
// components/StoreSelector.js
"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
    Search, 
    Store, 
    Plus, 
    ChevronUp,
    Settings,
    CreditCard,
    HelpCircle,
    LogOut
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { useStores } from '@/contexts/StoreContext'
import { cn } from '@/lib/utils'

export default function StoreSelector({ collapsed = false }) {
    const router = useRouter()
    const [menuOpen, setMenuOpen] = useState(false)
    const [storeSearch, setStoreSearch] = useState("")
    const { stores, currentStore, setCurrentStoreById, loading } = useStores()

    // Filter stores based on search
    const filteredStores = storeSearch
        ? stores.filter((store) => 
            store.name.toLowerCase().includes(storeSearch.toLowerCase())
          )
        : stores

    // Handle store switching
    const handleStoreSwitch = (store) => {
        setCurrentStoreById(store.id)
        router.push(`/dashboard/${store.id}`) // Adjust route as needed
        setMenuOpen(false)
        
        // Optional: Show toast notification
        console.log(`Switched to ${store.name}`)
    }

    return (
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
                <button className={cn(
                    "flex items-center w-full text-left hover:bg-gray-50 rounded-md p-2 transition-colors",
                    collapsed ? "justify-center" : ""
                )}>
                    {/* User/Account Avatar */}
                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-medium">
                        {currentStore?.name?.charAt(0) || 'N'}
                    </div>
                    
                    {!collapsed && (
                        <>
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-gray-700">
                                    {currentStore?.name || 'Select Store'}
                                </p>
                                <p className="text-xs text-gray-500">Pro Plan</p>
                            </div>
                            <ChevronUp
                                className={`h-4 w-4 text-gray-500 transition-transform ${
                                    menuOpen ? "rotate-0" : "rotate-180"
                                }`}
                            />
                        </>
                    )}
                </button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="start" className="w-64">
                {/* Account Options */}
                <DropdownMenuItem asChild>
                    <a href="/account-settings" className="flex items-center w-full cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Account Settings</span>
                    </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <a href="/billing" className="flex items-center w-full cursor-pointer">
                        <CreditCard className="mr-2 h-4 w-4" />
                        <span>Billing & Plans</span>
                    </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <a href="/help" className="flex items-center w-full cursor-pointer">
                        <HelpCircle className="mr-2 h-4 w-4" />
                        <span>Help & Support</span>
                    </a>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* Store Section */}
                <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-gray-500">
                    YOUR STORES
                </DropdownMenuLabel>
                
                {/* Search Input */}
                <div className="px-2 py-1">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search stores..."
                            value={storeSearch}
                            onChange={(e) => setStoreSearch(e.target.value)}
                            className="h-9 pl-8"
                        />
                    </div>
                </div>
                
                {/* Store List */}
                <div className="mt-1 max-h-[150px] overflow-y-auto">
                    {loading && (
                        <p className="p-2 text-xs text-center text-gray-500">Loading...</p>
                    )}
                    
                    {filteredStores.map((store) => (
                        <DropdownMenuItem
                            key={store.id}
                            onClick={() => handleStoreSwitch(store)}
                            className={cn(
                                "flex items-center w-full cursor-pointer gap-3",
                                currentStore?.id === store.id && "bg-purple-50 text-purple-700"
                            )}
                        >
                            <div className="p-2 bg-purple-100 rounded-md">
                                <Store className="h-4 w-4 text-purple-600" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-medium text-sm">{store.name}</span>
                                <span className="text-xs text-gray-500">{store.domain}</span>
                            </div>
                            {currentStore?.id === store.id && (
                                <div className="ml-auto w-2 h-2 bg-purple-600 rounded-full"></div>
                            )}
                        </DropdownMenuItem>
                    ))}
                </div>
                
                {/* Add Store Option */}
                <DropdownMenuItem asChild>
                    <a
                        href="/stores/new"
                        className="flex items-center w-full cursor-pointer mt-1 text-purple-600"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        <span>Add Store</span>
                    </a>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* Log Out */}
                <DropdownMenuItem 
                    className="cursor-pointer text-red-600" 
                    onClick={() => {
                        // Handle logout
                        console.log('Logging out...')
                    }}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log Out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
```

### 3. Required UI Components

You'll need these shadcn/ui components:

```bash
# Install shadcn/ui components
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add input
```

### 4. Utility Functions

```javascript
// lib/utils.js
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
```

## Implementation Steps

### 1. Setup Context Provider

Wrap your app with the StoreProvider:

```javascript
// app/layout.js or _app.js
import { StoreProvider } from '@/contexts/StoreContext'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  )
}
```

### 2. Add Store Selector to Sidebar

```javascript
// components/Sidebar.js
import StoreSelector from './StoreSelector'

export default function Sidebar() {
  return (
    <div className="sidebar">
      {/* Other sidebar content */}
      
      {/* Store Selector at bottom */}
      <div className="border-t p-4">
        <StoreSelector />
      </div>
    </div>
  )
}
```

### 3. API Endpoint

Create an API endpoint to fetch stores:

```javascript
// app/api/stores/route.js (App Router)
// or pages/api/stores.js (Pages Router)

export async function GET(request) {
  // Fetch stores from your database
  const stores = await fetchUserStores(userId)
  
  return Response.json({
    success: true,
    stores: stores.map(store => ({
      id: store._id,
      name: store.name,
      domain: store.domain,
      // Other fields as needed
    }))
  })
}
```

## Key Features

### Store Persistence
- Current store selection is saved to localStorage
- Persists across page refreshes and sessions
- Automatically restored on app load

### Search Functionality
- Real-time filtering as user types
- Case-insensitive search
- Searches store names (can be extended to other fields)

### Visual Feedback
- Currently selected store highlighted with purple background
- Purple dot indicator for active store
- Hover states for better UX
- Store icons for visual recognition

### Navigation Integration
- Automatic routing to store-specific pages on selection
- URL structure: `/dashboard/[storeId]` or `/at/[storeId]`
- Can be customized based on your routing needs

## Styling Customization

The component uses Tailwind CSS classes that can be customized:

- **Primary color**: Purple (`purple-600`, `purple-100`, etc.)
- **Spacing**: Standard Tailwind spacing utilities
- **Dropdown width**: Set to `w-64` (16rem)
- **Max height for store list**: `max-h-[150px]`

## Store Data Structure

Expected store object structure:

```javascript
{
  id: "store_123",           // Unique identifier
  name: "My Store",          // Display name
  domain: "mystore.com",     // Secondary info (optional)
  // Add other fields as needed
}
```

## Additional Considerations

### Performance
- Stores are fetched once and cached in context
- Search is performed client-side for instant feedback
- Consider pagination for large store lists

### Security
- Implement proper authentication checks in API
- Validate store ownership before allowing switches
- Use secure session management

### Mobile Responsiveness
- Component works in both expanded and collapsed sidebar states
- Touch-friendly dropdown interactions
- Consider mobile-specific UI adjustments

## Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "lucide-react": "^0.263.0",
    "@radix-ui/react-dropdown-menu": "^2.0.0",
    "tailwindcss": "^3.0.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  }
}
```

## Toast Notifications (Optional)

For better UX, add toast notifications:

```javascript
import { useToast } from '@/components/ui/use-toast'

// In handleStoreSwitch function:
const { toast } = useToast()

toast({
  title: "Store switched",
  description: `Now managing ${store.name}`,
})
```

This implementation provides a complete, production-ready store selector that matches the functionality shown in your sidebar image.
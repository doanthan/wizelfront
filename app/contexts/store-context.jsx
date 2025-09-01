"use client";

import { createContext, useContext, useState, useEffect } from "react";

const StoreContext = createContext({
  stores: [],
  tags: [],
  userPermissions: {},
  currentUser: null,
  organizationType: 'enterprise',
  addStore: () => {},
  updateStore: () => {},
  deleteStore: () => {},
  addTag: () => {},
  deleteTag: () => {},
  assignTagToStore: () => {},
  removeTagFromStore: () => {},
  updateUserPermissions: () => {},
  getUserAccessibleStores: () => [],
  canUserAccessStore: () => false,
  getStoreHierarchy: () => [],
  isParentStore: () => false,
});

export const useStores = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStores must be used within a StoreProvider");
  }
  return context;
};

export const StoreProvider = ({ children }) => {
  // Organization type configuration
  const [organizationType, setOrganizationType] = useState('enterprise');
  
  // Enhanced store data with organization structure
  const [stores, setStores] = useState([
    { 
      id: "store1",
      public_id: "STORE-001",
      name: "Main Store",
      url: "https://mainstore.com",
      organization_type: "enterprise",
      account_type: "root_account",
      parent_store_id: null,
      organization_id: "ORG-001",
      revenue: 4250, 
      orders: 142,
      tags: ["flagship", "us-east"],
      tagNames: ["Flagship", "US East"],
      metrics: {
        change: 12.5,
        aov: 29.93,
        conversionRate: 3.24,
      },
      locked_elements: {
        templates: [],
        brandAssets: new Map()
      },
      permission_version: "v2"
    },
    { 
      id: "store2",
      public_id: "STORE-002", 
      name: "Europe Store",
      url: "https://europestore.com",
      organization_type: "enterprise",
      account_type: "sub_account",
      parent_store_id: "store1",
      organization_id: "ORG-001",
      revenue: 3180, 
      orders: 98,
      tags: ["international", "eu"],
      tagNames: ["International", "Europe"],
      metrics: {
        change: 8.2,
        aov: 32.45,
        conversionRate: 2.87,
      },
      locked_elements: {
        templates: [],
        brandAssets: new Map()
      },
      permission_version: "v2"
    },
    { 
      id: "store3",
      public_id: "STORE-003",
      name: "Asia Pacific",
      url: "https://apacstore.com",
      organization_type: "enterprise",
      account_type: "sub_account",
      parent_store_id: "store1",
      organization_id: "ORG-001", 
      revenue: 2840, 
      orders: 87,
      tags: ["international", "apac"],
      tagNames: ["International", "Asia Pacific"],
      metrics: {
        change: -3.5,
        aov: 32.64,
        conversionRate: 2.45,
      },
      locked_elements: {
        templates: [],
        brandAssets: new Map()
      },
      permission_version: "v2"
    },
    { 
      id: "store4",
      public_id: "STORE-004",
      name: "North America",
      url: "https://northamerica.com",
      organization_type: "enterprise",
      account_type: "sub_account",
      parent_store_id: "store1",
      organization_id: "ORG-001",
      revenue: 2520, 
      orders: 76,
      tags: ["us-west", "flagship"],
      tagNames: ["US West", "Flagship"],
      metrics: {
        change: 15.8,
        aov: 33.16,
        conversionRate: 3.56,
      },
      locked_elements: {
        templates: [],
        brandAssets: new Map()
      },
      permission_version: "v2"
    },
    { 
      id: "store5",
      public_id: "STORE-005",
      name: "Latin America",
      url: "https://latamstore.com",
      organization_type: "enterprise",
      account_type: "sub_account",
      parent_store_id: "store1",
      organization_id: "ORG-001",
      revenue: 1890, 
      orders: 54,
      tags: ["international", "latam"],
      tagNames: ["International", "Latin America"],
      metrics: {
        change: -7.2,
        aov: 35.00,
        conversionRate: 1.89,
      },
      locked_elements: {
        templates: [],
        brandAssets: new Map()
      },
      permission_version: "v2"
    },
  ]);

  const [tags, setTags] = useState([
    { id: "flagship", name: "Flagship", color: "blue" },
    { id: "international", name: "International", color: "purple" },
    { id: "us-east", name: "US East", color: "green" },
    { id: "us-west", name: "US West", color: "yellow" },
    { id: "eu", name: "Europe", color: "indigo" },
    { id: "apac", name: "Asia Pacific", color: "pink" },
    { id: "latam", name: "Latin America", color: "orange" },
  ]);

  // Mock user permissions - maps user IDs to allowed tags
  const [userPermissions, setUserPermissions] = useState({
    "user1": ["flagship", "us-east", "us-west"], // Can view flagship and US stores
    "user2": ["international"], // Can view all international stores
    "user3": [], // Admin - empty array means all access
    "user4": ["eu", "apac"], // Can view EU and APAC stores
  });

  // Current user with enhanced schema
  const [currentUser, setCurrentUser] = useState({
    id: "user1",
    name: "John Doe",
    email: "john@example.com",
    isSuperUser: false,
    stores: [{
      store_id: "store1",
      store_public_id: "STORE-001",
      roleId: "manager",
      dataScope: "assigned_accounts",
      assignedAccounts: ["store1", "store2", "store3"],
      assignedStores: ["store1", "store2", "store3"],
      customPermissions: [],
      restrictions: [],
      organization_type: "enterprise"
    }],
    departmentId: "dept1",
    teamId: "team1",
  });

  // Store management functions
  const addStore = (store) => {
    // Ensure URL has https://
    let formattedUrl = store.url;
    if (formattedUrl && !formattedUrl.startsWith('http')) {
      formattedUrl = 'https://' + formattedUrl;
    }
    if (formattedUrl && formattedUrl.startsWith('http://')) {
      formattedUrl = formattedUrl.replace('http://', 'https://');
    }
    
    const newStore = {
      ...store,
      url: formattedUrl,
      id: store.id || `store${Date.now()}`,
      public_id: store.public_id || `STORE-${Date.now()}`,
      organization_type: organizationType,
      account_type: store.parent_store_id ? 'sub_account' : 'root_account',
      locked_elements: store.locked_elements || { templates: [], brandAssets: new Map() },
      permission_version: 'v2',
      // Set default values for display purposes
      revenue: store.revenue || 0,
      orders: store.orders || 0,
      metrics: store.metrics || {
        change: 0,
        aov: 0,
        conversionRate: 0
      }
    };
    setStores(prev => [...prev, newStore]);
  };

  const updateStore = (storeId, updates) => {
    // Ensure URL has https:// if URL is being updated
    let formattedUpdates = { ...updates };
    if (updates.url) {
      let formattedUrl = updates.url;
      if (!formattedUrl.startsWith('http')) {
        formattedUrl = 'https://' + formattedUrl;
      }
      if (formattedUrl.startsWith('http://')) {
        formattedUrl = formattedUrl.replace('http://', 'https://');
      }
      formattedUpdates.url = formattedUrl;
    }
    
    setStores(prev => 
      prev.map(store => 
        store.id === storeId ? { ...store, ...formattedUpdates } : store
      )
    );
  };

  const deleteStore = (storeId) => {
    setStores(prev => prev.filter(store => store.id !== storeId));
  };

  // Tag management functions
  const addTag = (tag) => {
    setTags(prev => [...prev, { ...tag, id: tag.id || Date.now().toString() }]);
  };

  const deleteTag = (tagId) => {
    setTags(prev => prev.filter(tag => tag.id !== tagId));
    // Remove tag from all stores
    setStores(prev => 
      prev.map(store => ({
        ...store,
        tags: store.tags.filter(t => t !== tagId)
      }))
    );
  };

  const assignTagToStore = (storeId, tagId) => {
    setStores(prev => 
      prev.map(store => 
        store.id === storeId 
          ? { ...store, tags: [...new Set([...store.tags, tagId])] }
          : store
      )
    );
  };

  const removeTagFromStore = (storeId, tagId) => {
    setStores(prev => 
      prev.map(store => 
        store.id === storeId 
          ? { ...store, tags: store.tags.filter(t => t !== tagId) }
          : store
      )
    );
  };

  // Permission management
  const updateUserPermissions = (userId, allowedTags) => {
    setUserPermissions(prev => ({
      ...prev,
      [userId]: allowedTags
    }));
  };

  // Get stores accessible by a user based on new permission model
  const getUserAccessibleStores = (userId = currentUser?.id) => {
    // Find the user - in production this would come from context
    const user = userId === currentUser?.id ? currentUser : null;
    
    if (!user) return [];
    
    // Super user can access everything
    if (user.isSuperUser) {
      return stores;
    }
    
    // Get user's store access configuration
    const storeAccess = user.stores?.[0]; // Simplified for demo
    if (!storeAccess) return [];
    
    // Check data scope
    switch (storeAccess.dataScope) {
      case 'global':
        return stores;
      case 'organization':
        return stores.filter(s => s.organization_id === stores[0].organization_id);
      case 'assigned_accounts':
        return stores.filter(s => storeAccess.assignedStores.includes(s.id));
      case 'own_account':
        return stores.filter(s => s.id === storeAccess.store_id);
      default:
        // Tag-based fallback for backward compatibility
        const allowedTags = userPermissions[userId];
        if (!allowedTags || allowedTags.length === 0) {
          return stores;
        }
        return stores.filter(store => 
          store.tags.some(tag => allowedTags.includes(tag))
        );
    }
  };

  // Check if user can access a specific store
  const canUserAccessStore = (storeId, userId = currentUser?.id) => {
    const accessibleStores = getUserAccessibleStores(userId);
    return accessibleStores.some(s => s.id === storeId);
  };
  
  // Get store hierarchy (parent-child relationships)
  const getStoreHierarchy = () => {
    const rootStores = stores.filter(s => !s.parent_store_id);
    
    const buildHierarchy = (parentId) => {
      return stores.filter(s => s.parent_store_id === parentId).map(store => ({
        ...store,
        children: buildHierarchy(store.id)
      }));
    };
    
    return rootStores.map(store => ({
      ...store,
      children: buildHierarchy(store.id)
    }));
  };
  
  // Check if a store is a parent store
  const isParentStore = (storeId) => {
    return stores.some(s => s.parent_store_id === storeId);
  };

  // Load data from localStorage on mount
  useEffect(() => {
    const savedStores = localStorage.getItem("stores");
    const savedTags = localStorage.getItem("tags");
    const savedPermissions = localStorage.getItem("userPermissions");

    if (savedStores) setStores(JSON.parse(savedStores));
    if (savedTags) setTags(JSON.parse(savedTags));
    if (savedPermissions) setUserPermissions(JSON.parse(savedPermissions));
  }, []);

  // Save data to localStorage on change
  useEffect(() => {
    localStorage.setItem("stores", JSON.stringify(stores));
  }, [stores]);

  useEffect(() => {
    localStorage.setItem("tags", JSON.stringify(tags));
  }, [tags]);

  useEffect(() => {
    localStorage.setItem("userPermissions", JSON.stringify(userPermissions));
  }, [userPermissions]);

  return (
    <StoreContext.Provider
      value={{
        stores,
        tags,
        userPermissions,
        currentUser,
        organizationType,
        setOrganizationType,
        addStore,
        updateStore,
        deleteStore,
        addTag,
        deleteTag,
        assignTagToStore,
        removeTagFromStore,
        updateUserPermissions,
        getUserAccessibleStores,
        canUserAccessStore,
        getStoreHierarchy,
        isParentStore,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};
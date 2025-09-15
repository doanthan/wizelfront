"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

const StoreContext = createContext({
  stores: [],
  tags: [],
  userPermissions: {},
  currentUser: null,
  userContracts: [],
  currentContract: null,
  organizationType: 'enterprise',
  recentStores: [],
  selectedStoreId: null,
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
  checkUserStorePermission: () => false,
  switchContract: () => {},
  getStoreHierarchy: () => [],
  isParentStore: () => false,
  refreshStores: () => {},
  isLoadingStores: false,
  selectStore: () => {},
  getRecentStores: () => [],
});

export const useStores = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStores must be used within a StoreProvider");
  }
  return context;
};

export const StoreProvider = ({ children }) => {
  const { data: session } = useSession();
  // Organization type configuration
  const [organizationType, setOrganizationType] = useState('enterprise');
  
  // Multi-contract state
  const [userContracts, setUserContracts] = useState([]);
  const [currentContract, setCurrentContract] = useState(null);
  
  // Start with empty stores - will be loaded from API
  const [stores, setStores] = useState([]);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  
  // Store selection and recent stores tracking
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [recentStoreIds, setRecentStoreIds] = useState([]);

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
      id: store.id || store._id || `store${Date.now()}`,
      public_id: store.public_id, // Don't add fallback - should come from API
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

  // Get stores accessible by a user based on ContractSeat system
  const getUserAccessibleStores = (userId = session?.user?.id) => {
    console.log('getUserAccessibleStores called with userId:', userId);
    console.log('Current stores array:', stores);
    console.log('Session user:', session?.user);
    console.log('Current contract:', currentContract);
    
    if (!session?.user) {
      console.log('No session user, returning empty array');
      return [];
    }
    
    // If current contract is set, filter stores by contract
    if (currentContract) {
      const contractStores = stores.filter(store => 
        store.contract_id === currentContract.id || 
        store.contract_id === currentContract.contract_id
      );
      console.log('Contract-filtered stores:', contractStores.length);
      return contractStores;
    }
    
    // Otherwise return all accessible stores (server already filtered)
    console.log('Session user found, returning all accessible stores:', stores.length);
    return stores;
  };

  // Check if user can access a specific store
  const canUserAccessStore = (storeId, userId = session?.user?.id) => {
    if (!session?.user) return false;
    
    const accessibleStores = getUserAccessibleStores(userId);
    return accessibleStores.some(s => s.id === storeId || s._id === storeId);
  };
  
  // Check specific permission for a store
  const checkUserStorePermission = async (storeId, permission) => {
    if (!session?.user) return false;
    
    try {
      const response = await fetch(`/api/stores/${storeId}/permissions`);
      if (response.ok) {
        const permissions = await response.json();
        return permissions.permissions?.[permission] === true;
      }
    } catch (error) {
      console.error('Error checking store permission:', error);
    }
    
    return false;
  };
  
  // Switch to a different contract context
  const switchContract = (contractId) => {
    const contract = userContracts.find(c => 
      c.id === contractId || c.contract_id === contractId
    );
    if (contract) {
      setCurrentContract(contract);
      // Optionally refetch stores for the new contract
      fetchStoresFromAPI();
    }
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
  
  // Select a store and track it as recently used
  const selectStore = (storeId) => {
    if (!storeId) return;
    
    console.log('Selecting store:', storeId);
    setSelectedStoreId(storeId);
    
    // Update recent stores - move selected to front, keep max 10
    setRecentStoreIds(prev => {
      const filtered = prev.filter(id => id !== storeId);
      const updated = [storeId, ...filtered].slice(0, 10);
      console.log('Updated recent store IDs:', updated);
      // Save to localStorage
      localStorage.setItem('recentStoreIds', JSON.stringify(updated));
      return updated;
    });
  };
  
  // Get recent stores (up to 4)
  const getRecentStores = (limit = 4) => {
    // If we have recent store IDs, use them
    if (recentStoreIds && recentStoreIds.length > 0) {
      const recentStores = recentStoreIds
        .slice(0, limit)
        .map(id => stores.find(s => (s.public_id || s._id) === id))
        .filter(Boolean);
      
      // If we found stores from recent IDs, return them
      if (recentStores.length > 0) {
        return recentStores;
      }
    }
    
    // Otherwise return the first 'limit' stores as fallback
    return stores.slice(0, limit);
  };

  // Load user contracts and stores on session change
  useEffect(() => {
    if (session?.user) {
      fetchUserContracts();
      fetchStoresFromAPI();
    } else {
      // Clear state when no session
      setStores([]);
      setUserContracts([]);
      setCurrentContract(null);
    }
  }, [session]);
  
  // Load saved data from localStorage on mount
  useEffect(() => {
    // Clear old mock data from localStorage
    localStorage.removeItem("stores");
    
    // Load tags and permissions from localStorage if they exist
    const savedTags = localStorage.getItem("tags");
    const savedPermissions = localStorage.getItem("userPermissions");
    const savedContract = localStorage.getItem("currentContract");
    const savedRecentStores = localStorage.getItem("recentStoreIds");
    const savedSelectedStore = localStorage.getItem("selectedStoreId");

    if (savedTags) setTags(JSON.parse(savedTags));
    if (savedPermissions) setUserPermissions(JSON.parse(savedPermissions));
    if (savedContract) {
      try {
        const contract = JSON.parse(savedContract);
        setCurrentContract(contract);
      } catch (error) {
        console.error('Error parsing saved contract:', error);
      }
    }
    if (savedRecentStores) {
      try {
        setRecentStoreIds(JSON.parse(savedRecentStores));
      } catch (error) {
        console.error('Error parsing saved recent stores:', error);
      }
    }
    if (savedSelectedStore) {
      setSelectedStoreId(savedSelectedStore);
    }
  }, []);

  // Fetch user's contracts from API
  const fetchUserContracts = async () => {
    try {
      console.log('Fetching user contracts...');
      const response = await fetch('/api/contract');
      
      if (response.ok) {
        const data = await response.json();
        console.log('User contracts received:', data);
        
        if (data.contracts) {
          setUserContracts(data.contracts);
          
          // Set current contract if none is set
          if (!currentContract && data.contracts.length > 0) {
            setCurrentContract(data.contracts[0]);
          }
        }
      } else {
        console.error('Failed to fetch contracts:', response.status);
      }
    } catch (error) {
      console.error('Error fetching user contracts:', error);
    }
  };
  
  // Fetch stores from API
  const fetchStoresFromAPI = async () => {
    if (isLoadingStores) {
      console.log('Already loading stores, skipping...');
      return;
    }
    
    try {
      setIsLoadingStores(true);
      console.log('Fetching stores from API...');
      const response = await fetch('/api/store');
      console.log('API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('API data received:', data);
        console.log('Number of stores:', data.stores?.length || 0);
        
        // Always update stores, even if empty
        if (data.stores) {
          console.log('Processing stores from API:', data.stores);
          const apiStores = data.stores.map(store => {
            console.log('Processing store:', store.name, 'with public_id:', store.public_id);
            return {
            id: store._id || store.id,
            _id: store._id,
            name: store.name,
            url: store.url,
            public_id: store.public_id,
            contract_id: store.contract_id,
            platform: store.platform || 'shopify',
            subscription_status: store.subscription_status,
            trial_ends_at: store.trial_ends_at,
            organization_type: organizationType,
            account_type: store.parent_store_id ? 'sub_account' : 'root_account',
            parent_store_id: store.parent_store_id || null,
            organization_id: store.organization_id || 'ORG-001',
            klaviyo_integration: store.klaviyo_integration || {}, // Include klaviyo_integration
            shopify_integration: store.shopify_integration || {}, // Include shopify_integration
            revenue: store.revenue || 0,
            orders: store.orders || 0,
            tags: store.tags || [],
            tagNames: store.tagNames || [],
            team_members: store.team_members || [],
            metrics: store.metrics || {
              change: 0,
              aov: 0,
              conversionRate: 0
            },
            locked_elements: store.locked_elements || { templates: [], brandAssets: new Map() },
            permission_version: 'v3' // Updated for ContractSeat system
          };
          });
          
          console.log('Setting stores:', apiStores);
          setStores(apiStores);
        }
      } else {
        console.error('API response not ok:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Failed to fetch stores from API:', error);
    } finally {
      setIsLoadingStores(false);
    }
  };

  // Don't save stores to localStorage - fetch from API instead
  // useEffect(() => {
  //   localStorage.setItem("stores", JSON.stringify(stores));
  // }, [stores]);

  useEffect(() => {
    localStorage.setItem("tags", JSON.stringify(tags));
  }, [tags]);

  useEffect(() => {
    localStorage.setItem("userPermissions", JSON.stringify(userPermissions));
  }, [userPermissions]);
  
  // Save current contract to localStorage
  useEffect(() => {
    if (currentContract) {
      localStorage.setItem("currentContract", JSON.stringify(currentContract));
    }
  }, [currentContract]);
  
  // Save selected store to localStorage
  useEffect(() => {
    if (selectedStoreId) {
      localStorage.setItem("selectedStoreId", selectedStoreId);
    }
  }, [selectedStoreId]);

  return (
    <StoreContext.Provider
      value={{
        stores,
        tags,
        userPermissions,
        currentUser,
        userContracts,
        currentContract,
        organizationType,
        selectedStoreId,
        recentStores: getRecentStores(),
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
        checkUserStorePermission,
        switchContract,
        getStoreHierarchy,
        isParentStore,
        refreshStores: fetchStoresFromAPI,
        isLoadingStores,
        selectStore,
        getRecentStores,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import permission definitions (we'll define them inline for the script)
const ROLE_DEFINITIONS = {
  owner: {
    permissions: ['*:*'],
    dataScope: 'global'
  },
  admin: {
    permissions: [
      'dashboard:*',
      'templates:*',
      'campaigns:*',
      'content:*',
      'analytics:*',
      'accounts:*',
      'settings:*',
      'billing:view',
    ],
    dataScope: 'organization'
  },
  editor: {
    permissions: [
      'dashboard:view',
      'templates:view',
      'templates:create',
      'templates:edit',
      'campaigns:view',
      'campaigns:create',
      'campaigns:edit',
      'content:view',
      'content:create',
      'content:edit',
      'analytics:view',
    ],
    dataScope: 'assigned_accounts'
  },
  viewer: {
    permissions: [
      'dashboard:view',
      'templates:view',
      'campaigns:view',
      'content:view',
      'analytics:view',
    ],
    dataScope: 'assigned_accounts'
  }
};

function convertOldPermissions(oldPermissions) {
  const newPermissions = [];
  
  // Map old flags to new permissions
  const mappings = {
    canEditStore: ['settings:edit', 'settings:manage'],
    canManageUsers: ['accounts:manage', 'accounts:edit', 'accounts:create', 'accounts:delete'],
    canViewAnalytics: ['analytics:view'],
    canCreateCampaigns: ['campaigns:create'],
    canManageIntegrations: ['settings:manage'],
    canDeleteStore: ['settings:delete', 'billing:manage'],
    canManageBilling: ['billing:manage', 'billing:edit', 'billing:view'],
    canExportData: ['analytics:export'],
    canViewRevenue: ['analytics:view', 'dashboard:view'],
    canEditSettings: ['settings:edit'],
    canManageWebhooks: ['settings:manage'],
    canAccessAPI: ['settings:manage'],
    canEditBrand: ['content:edit', 'templates:edit'],
    canEditContent: ['content:edit', 'content:create'],
    canApproveContent: ['content:approve', 'campaigns:approve'],
  };
  
  Object.entries(oldPermissions).forEach(([flag, value]) => {
    if (value && mappings[flag]) {
      newPermissions.push(...mappings[flag]);
    }
  });
  
  // Remove duplicates
  return [...new Set(newPermissions)];
}

async function migratePermissions() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('wizel');
    const usersCollection = db.collection('users');
    
    // Get all users with store_permissions
    const users = await usersCollection.find({
      store_permissions: { $exists: true, $ne: [] }
    }).toArray();
    
    console.log(`Found ${users.length} users with store permissions to migrate`);
    
    let migratedCount = 0;
    
    for (const user of users) {
      console.log(`\nMigrating user: ${user.email}`);
      
      const updatedPermissions = user.store_permissions.map(sp => {
        // Skip if already has v2 permissions
        if (sp.permissions_v2 && sp.permissions_v2.length > 0) {
          console.log(`  - Store ${sp.store_id}: Already migrated`);
          return sp;
        }
        
        let newPermissions = [];
        let dataScope = 'assigned_accounts';
        
        // Convert based on role
        if (sp.role) {
          const roleDefinition = ROLE_DEFINITIONS[sp.role];
          if (roleDefinition) {
            newPermissions = roleDefinition.permissions;
            dataScope = roleDefinition.dataScope;
            console.log(`  - Store ${sp.store_id}: Converting role '${sp.role}' to ${newPermissions.length} permissions`);
          }
        }
        
        // If no role or role not found, convert from old permissions
        if (newPermissions.length === 0 && sp.permissions) {
          newPermissions = convertOldPermissions(sp.permissions);
          console.log(`  - Store ${sp.store_id}: Converting ${Object.keys(sp.permissions).filter(k => sp.permissions[k]).length} flags to ${newPermissions.length} permissions`);
        }
        
        // Update the permission object
        return {
          ...sp,
          permissions_v2: newPermissions,
          data_scope: sp.data_scope || dataScope
        };
      });
      
      // Update user in database
      const result = await usersCollection.updateOne(
        { _id: user._id },
        { 
          $set: { 
            store_permissions: updatedPermissions,
            updatedAt: new Date()
          }
        }
      );
      
      if (result.modifiedCount > 0) {
        migratedCount++;
        console.log(`  ✅ Successfully migrated ${user.email}`);
      }
    }
    
    console.log(`\n========================================`);
    console.log(`Migration completed!`);
    console.log(`Total users migrated: ${migratedCount}`);
    
    // Show sample of migrated data
    if (migratedCount > 0) {
      const sampleUser = await usersCollection.findOne({
        email: 'doanthan@gmail.com'
      });
      
      if (sampleUser && sampleUser.store_permissions?.length > 0) {
        console.log(`\nSample migrated permissions for ${sampleUser.email}:`);
        const samplePermission = sampleUser.store_permissions[0];
        console.log(`  Role: ${samplePermission.role}`);
        console.log(`  Data Scope: ${samplePermission.data_scope}`);
        console.log(`  V2 Permissions (first 5):`, samplePermission.permissions_v2?.slice(0, 5));
      }
    }
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the migration
console.log('🔄 Starting permission migration to V2 system...\n');
migratePermissions();
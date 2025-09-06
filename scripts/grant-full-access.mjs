import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function grantFullAccess() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('wizel');
    const usersCollection = db.collection('users');
    const storesCollection = db.collection('stores');
    
    // Find the user
    const user = await usersCollection.findOne({ 
      email: 'doanthan@gmail.com' 
    });
    
    if (!user) {
      console.error('User not found');
      return;
    }
    
    console.log('Found user:', user.name);
    
    // Get ALL stores in the database
    const allStores = await storesCollection.find({
      is_deleted: { $ne: true }
    }).toArray();
    
    console.log(`Found ${allStores.length} stores in database`);
    
    // Create owner permissions for ALL stores
    const storePermissions = allStores.map(store => ({
      store_id: store._id,
      store_name: store.name, // For reference
      role: 'owner', // Full owner access
      permissions: {
        canEditStore: true,
        canManageUsers: true,
        canViewAnalytics: true,
        canCreateCampaigns: true,
        canManageIntegrations: true,
        canDeleteStore: true,
        canManageBilling: true,
        canExportData: true,
        canViewRevenue: true,
        canEditSettings: true,
        canManageWebhooks: true,
        canAccessAPI: true,
      },
      granted_by: user._id, // Self-granted as super admin
      granted_at: new Date()
    }));
    
    // Update user with full permissions to all stores
    const result = await usersCollection.updateOne(
      { _id: user._id },
      { 
        $set: { 
          store_permissions: storePermissions,
          role: 'super_admin', // Ensure super admin role
          is_super_admin: true, // Add super admin flag
          updatedAt: new Date()
        }
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Successfully granted full access to all stores');
      console.log('\nFull owner permissions granted for:');
      storePermissions.forEach(sp => {
        console.log(`  ✓ ${sp.store_name || sp.store_id}: OWNER role with all permissions`);
      });
      console.log(`\nTotal: ${storePermissions.length} stores`);
      console.log('User role: SUPER ADMIN');
    } else {
      console.log('❌ No changes made');
    }
    
    // Also update stores to add user as owner if not already
    for (const store of allStores) {
      // Check if user is in store's users array
      const hasUser = store.users?.some(u => 
        u.userId?.toString() === user._id.toString()
      );
      
      if (!hasUser) {
        await storesCollection.updateOne(
          { _id: store._id },
          {
            $push: {
              users: {
                userId: user._id,
                role: 'owner',
                permissions: {
                  canEditStore: true,
                  canEditBrand: true,
                  canEditContent: true,
                  canApproveContent: true,
                  canViewAnalytics: true,
                  canManageIntegrations: true,
                  canManageUsers: true,
                },
                addedAt: new Date(),
                addedBy: user._id
              }
            }
          }
        );
        console.log(`  Added as owner to store: ${store.name}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the script
console.log('🔐 Granting full access to doanthan@gmail.com for all stores...\n');
grantFullAccess();
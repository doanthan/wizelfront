import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function fixStorePermissions() {
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
    
    // Create owner permissions for ALL actual stores
    const storePermissions = allStores.map(store => ({
      store_id: store._id,
      store_name: store.name, // For reference
      role: 'owner', // Full owner access
      permissions_v2: ['*:*'], // All permissions in V2 system
      data_scope: 'global',
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
    
    // Update user with correct permissions
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
      console.log('✅ Successfully fixed store permissions');
      console.log('\nCorrect permissions granted for:');
      storePermissions.forEach(sp => {
        console.log(`  ✓ ${sp.store_name || sp.store_id}: OWNER role with all permissions (*:*)`);
      });
      console.log(`\nTotal: ${storePermissions.length} stores`);
      console.log('User role: SUPER ADMIN');
    } else {
      console.log('❌ No changes made');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the script
console.log('🔧 Fixing store permissions to match actual stores in database...\n');
fixStorePermissions();
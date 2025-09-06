import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function migrateUserPermissions() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('wizel');
    const usersCollection = db.collection('users');
    const storesCollection = db.collection('stores');
    
    // Find the user to migrate
    const user = await usersCollection.findOne({ 
      email: 'doanthan@gmail.com' 
    });
    
    if (!user) {
      console.error('User not found');
      return;
    }
    
    console.log('Found user:', user.name);
    
    // Get all stores for this user
    const stores = await storesCollection.find({
      $or: [
        { owner_id: user._id },
        { 'users.userId': user._id },
        { user_id: user._id }
      ]
    }).toArray();
    
    console.log(`Found ${stores.length} stores for user`);
    
    // Create store-specific permissions
    const storePermissions = stores.map(store => {
      // Check if user is owner
      const isOwner = store.owner_id?.toString() === user._id.toString() ||
                      store.user_id?.toString() === user._id.toString();
      
      // Check user's role in store.users array if exists
      const storeUser = store.users?.find(u => 
        u.userId?.toString() === user._id.toString()
      );
      
      const role = isOwner ? 'owner' : (storeUser?.role || 'admin');
      
      return {
        store_id: store._id,
        store_name: store.name, // For reference
        role: role,
        permissions: {
          canEditStore: role === 'owner' || role === 'admin',
          canManageUsers: role === 'owner' || role === 'admin',
          canViewAnalytics: true,
          canCreateCampaigns: role !== 'viewer',
          canManageIntegrations: role === 'owner' || role === 'admin',
          canDeleteStore: role === 'owner',
          canManageBilling: role === 'owner',
          canExportData: true,
        },
        granted_by: isOwner ? user._id : store.owner_id,
        granted_at: new Date()
      };
    });
    
    // Update user with store-specific permissions
    const result = await usersCollection.updateOne(
      { _id: user._id },
      { 
        $set: { 
          store_permissions: storePermissions,
          updatedAt: new Date()
        }
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Successfully migrated user permissions');
      console.log('\nStore permissions added:');
      storePermissions.forEach(sp => {
        console.log(`  - ${sp.store_name}: ${sp.role} role`);
      });
    } else {
      console.log('❌ No changes made');
    }
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
migrateUserPermissions();
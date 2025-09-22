import User from '@/models/User';
import Store from '@/models/Store';
import connectToDatabase from '@/lib/mongoose';

export class UserModel {
  /**
   * Get user by ID with populated store data
   */
  static async getUserById(userId) {
    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email) {
    await connectToDatabase();

    const user = await User.findOne({ email });
    return user;
  }

  /**
   * Get user's accessible stores
   */
  static async getUserStores(userId) {
    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // If user has no store_ids, return empty array
    if (!user.store_ids || user.store_ids.length === 0) {
      return [];
    }

    // Get all stores the user has access to
    const stores = await Store.find({
      public_id: { $in: user.store_ids },
      is_deleted: { $ne: true }
    });

    return stores;
  }

  /**
   * Check if user has access to a specific store
   */
  static async hasStoreAccess(userId, storeId) {
    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      return false;
    }

    // Check if user has access to this store
    return user.store_ids && user.store_ids.includes(storeId);
  }

  /**
   * Add store access to user
   */
  static async addStoreAccess(userId, storeId) {
    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if store exists
    const store = await Store.findOne({ public_id: storeId });
    if (!store) {
      throw new Error('Store not found');
    }

    // Add store to user's store_ids if not already present
    if (!user.store_ids.includes(storeId)) {
      user.store_ids.push(storeId);
      await user.save();
    }

    return user;
  }

  /**
   * Remove store access from user
   */
  static async removeStoreAccess(userId, storeId) {
    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Remove store from user's store_ids
    user.store_ids = user.store_ids.filter(id => id !== storeId);
    await user.save();

    return user;
  }

  /**
   * Check if user is superuser
   */
  static async isSuperUser(userId) {
    await connectToDatabase();

    const user = await User.findById(userId);
    return user?.is_super_user === true;
  }

  /**
   * Update user's last login
   */
  static async updateLastLogin(userId) {
    await connectToDatabase();

    await User.findByIdAndUpdate(userId, {
      last_login: new Date()
    });
  }

  /**
   * Get user's permissions for a specific store
   */
  static async getStorePermissions(userId, storeId) {
    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      return null;
    }

    // Check if user has access to this store
    const hasAccess = user.store_ids && user.store_ids.includes(storeId);
    if (!hasAccess && !user.is_super_user) {
      return null;
    }

    // For now, return basic permissions
    // This can be expanded later with role-based permissions
    return {
      canView: true,
      canEdit: user.is_super_user || hasAccess,
      canDelete: user.is_super_user,
      canManageUsers: user.is_super_user,
      isSuperUser: user.is_super_user === true
    };
  }

  /**
   * Create a new user
   */
  static async createUser(userData) {
    await connectToDatabase();

    const user = new User({
      ...userData,
      store_ids: userData.store_ids || [],
      is_super_user: userData.is_super_user || false,
      created_at: new Date()
    });

    await user.save();
    return user;
  }

  /**
   * Update user data
   */
  static async updateUser(userId, updateData) {
    await connectToDatabase();

    const user = await User.findByIdAndUpdate(
      userId,
      {
        ...updateData,
        updated_at: new Date()
      },
      { new: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}
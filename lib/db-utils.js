import connectToDatabase from './mongoose';
import Store from '@/models/Store';
import User from '@/models/User';

/**
 * Wrapper to ensure database connection before operations
 * @param {Function} handler - The async function to execute
 * @returns {Function} - Wrapped handler
 */
export function withDatabase(handler) {
  return async (req, res) => {
    try {
      await connectToDatabase();
      return await handler(req, res);
    } catch (error) {
      console.error('Database operation failed:', error);
      return res.status(500).json({
        error: 'Database connection failed',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  };
}

/**
 * Generic CRUD operations
 */
export const dbOperations = {
  /**
   * Create a new document
   * @param {mongoose.Model} Model - Mongoose model
   * @param {Object} data - Document data
   * @returns {Promise<Object>}
   */
  async create(Model, data) {
    await connectToDatabase();
    const document = new Model(data);
    return await document.save();
  },

  /**
   * Find documents
   * @param {mongoose.Model} Model - Mongoose model
   * @param {Object} query - MongoDB query
   * @param {Object} options - Query options (select, sort, limit, etc.)
   * @returns {Promise<Array>}
   */
  async find(Model, query = {}, options = {}) {
    await connectToDatabase();
    let queryBuilder = Model.find(query);
    
    if (options.select) queryBuilder = queryBuilder.select(options.select);
    if (options.sort) queryBuilder = queryBuilder.sort(options.sort);
    if (options.limit) queryBuilder = queryBuilder.limit(options.limit);
    if (options.skip) queryBuilder = queryBuilder.skip(options.skip);
    if (options.populate) queryBuilder = queryBuilder.populate(options.populate);
    
    return await queryBuilder.exec();
  },

  /**
   * Find one document
   * @param {mongoose.Model} Model - Mongoose model
   * @param {Object} query - MongoDB query
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>}
   */
  async findOne(Model, query, options = {}) {
    await connectToDatabase();
    let queryBuilder = Model.findOne(query);
    
    if (options.select) queryBuilder = queryBuilder.select(options.select);
    if (options.populate) queryBuilder = queryBuilder.populate(options.populate);
    
    return await queryBuilder.exec();
  },

  /**
   * Find by ID
   * @param {mongoose.Model} Model - Mongoose model
   * @param {string} id - Document ID
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>}
   */
  async findById(Model, id, options = {}) {
    await connectToDatabase();
    let queryBuilder = Model.findById(id);
    
    if (options.select) queryBuilder = queryBuilder.select(options.select);
    if (options.populate) queryBuilder = queryBuilder.populate(options.populate);
    
    return await queryBuilder.exec();
  },

  /**
   * Update a document
   * @param {mongoose.Model} Model - Mongoose model
   * @param {Object} query - MongoDB query
   * @param {Object} update - Update data
   * @param {Object} options - Update options
   * @returns {Promise<Object|null>}
   */
  async updateOne(Model, query, update, options = {}) {
    await connectToDatabase();
    return await Model.findOneAndUpdate(
      query,
      update,
      { new: true, runValidators: true, ...options }
    );
  },

  /**
   * Update by ID
   * @param {mongoose.Model} Model - Mongoose model
   * @param {string} id - Document ID
   * @param {Object} update - Update data
   * @param {Object} options - Update options
   * @returns {Promise<Object|null>}
   */
  async updateById(Model, id, update, options = {}) {
    await connectToDatabase();
    return await Model.findByIdAndUpdate(
      id,
      update,
      { new: true, runValidators: true, ...options }
    );
  },

  /**
   * Delete a document
   * @param {mongoose.Model} Model - Mongoose model
   * @param {Object} query - MongoDB query
   * @returns {Promise<Object|null>}
   */
  async deleteOne(Model, query) {
    await connectToDatabase();
    return await Model.findOneAndDelete(query);
  },

  /**
   * Delete by ID
   * @param {mongoose.Model} Model - Mongoose model
   * @param {string} id - Document ID
   * @returns {Promise<Object|null>}
   */
  async deleteById(Model, id) {
    await connectToDatabase();
    return await Model.findByIdAndDelete(id);
  },

  /**
   * Count documents
   * @param {mongoose.Model} Model - Mongoose model
   * @param {Object} query - MongoDB query
   * @returns {Promise<number>}
   */
  async count(Model, query = {}) {
    await connectToDatabase();
    return await Model.countDocuments(query);
  },

  /**
   * Check if document exists
   * @param {mongoose.Model} Model - Mongoose model
   * @param {Object} query - MongoDB query
   * @returns {Promise<boolean>}
   */
  async exists(Model, query) {
    await connectToDatabase();
    const count = await Model.countDocuments(query);
    return count > 0;
  }
};

/**
 * Store-specific operations
 */
export const storeOperations = {
  /**
   * Create a new store with URL validation
   * @param {Object} storeData - Store data
   * @returns {Promise<Object>}
   */
  async createStore(storeData) {
    // Ensure URL has https://
    if (storeData.url && !storeData.url.startsWith('http')) {
      storeData.url = 'https://' + storeData.url;
    }
    if (storeData.url && storeData.url.startsWith('http://')) {
      storeData.url = storeData.url.replace('http://', 'https://');
    }
    
    return await dbOperations.create(Store, storeData);
  },

  /**
   * Get stores accessible by user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async getUserStores(userId, options = {}) {
    // This would be enhanced with your permission system
    return await dbOperations.find(
      Store,
      { 'users.userId': userId },
      options
    );
  },

  /**
   * Add tag to store
   * @param {string} storeId - Store ID
   * @param {string} tagName - Tag name
   * @returns {Promise<Object>}
   */
  async addTagToStore(storeId, tagName) {
    return await dbOperations.updateById(
      Store,
      storeId,
      { $addToSet: { tagNames: tagName } }
    );
  },

  /**
   * Remove tag from store
   * @param {string} storeId - Store ID
   * @param {string} tagName - Tag name
   * @returns {Promise<Object>}
   */
  async removeTagFromStore(storeId, tagName) {
    return await dbOperations.updateById(
      Store,
      storeId,
      { $pull: { tagNames: tagName } }
    );
  }
};

/**
 * User-specific operations
 */
export const userOperations = {
  /**
   * Find or create user
   * @param {Object} userData - User data
   * @returns {Promise<Object>}
   */
  async findOrCreateUser(userData) {
    let user = await dbOperations.findOne(User, { email: userData.email });
    
    if (!user) {
      user = await dbOperations.create(User, userData);
    }
    
    return user;
  },

  /**
   * Add store access to user
   * @param {string} userId - User ID
   * @param {string} storeId - Store ID
   * @param {string} roleId - Role ID
   * @returns {Promise<Object>}
   */
  async addStoreAccess(userId, storeId, roleId) {
    return await dbOperations.updateById(
      User,
      userId,
      {
        $push: {
          stores: {
            store_id: storeId,
            roleId: roleId,
            dataScope: 'assigned_accounts',
            assignedStores: [storeId],
            joined_at: new Date()
          }
        }
      }
    );
  },

  /**
   * Remove store access from user
   * @param {string} userId - User ID
   * @param {string} storeId - Store ID
   * @returns {Promise<Object>}
   */
  async removeStoreAccess(userId, storeId) {
    return await dbOperations.updateById(
      User,
      userId,
      {
        $pull: {
          stores: { store_id: storeId }
        }
      }
    );
  }
};
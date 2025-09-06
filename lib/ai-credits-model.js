import clientPromise from './mongodb.js';
import { ObjectId } from 'mongodb';
import { ContractModel } from './contract-model.js';
import { StoreModel } from './store-model.js';

export class AICreditsModel {
  static async getCollection() {
    const client = await clientPromise;
    const db = client.db('wizel');
    return db.collection('ai_usage_logs');
  }

  static async consumeCredits(storeId, userId, action, creditsToConsume, metadata = {}) {
    try {
      // Get store to find its contract
      const store = await StoreModel.getStoreById(storeId);
      if (!store) {
        throw new Error('Store not found');
      }

      // Get contract to check credit balance
      const contract = await ContractModel.getContractById(store.contract_id);
      if (!contract) {
        throw new Error('Contract not found');
      }

      // Check if contract has enough credits
      if (contract.ai_credits_balance < creditsToConsume) {
        throw new Error('Insufficient AI credits');
      }

      // Log the usage
      const collection = await this.getCollection();
      const usageLog = {
        user_id: new ObjectId(userId),
        store_id: new ObjectId(storeId),
        contract_id: new ObjectId(store.contract_id),
        action: action, // 'generate_email', 'ai_recommendation', 'content_optimization'
        credits_consumed: creditsToConsume,
        metadata: metadata,
        timestamp: new Date()
      };

      await collection.insertOne(usageLog);

      // Deduct credits from contract
      await ContractModel.updateAICredits(
        store.contract_id.toString(), 
        -creditsToConsume, 
        'use'
      );

      // Return updated balance
      const updatedContract = await ContractModel.getContractById(store.contract_id);
      return {
        success: true,
        remaining_credits: updatedContract.ai_credits_balance,
        usage_log_id: usageLog._id
      };
    } catch (error) {
      throw error;
    }
  }

  static async getContractBalance(contractId) {
    const contract = await ContractModel.getContractById(contractId);
    return contract ? contract.ai_credits_balance : 0;
  }

  static async getStoreBalance(storeId) {
    const store = await StoreModel.getStoreById(storeId);
    if (!store) return 0;
    
    return await this.getContractBalance(store.contract_id);
  }

  static async getUserUsageHistory(userId, limit = 50) {
    const collection = await this.getCollection();
    return await collection.find(
      { user_id: new ObjectId(userId) },
      { limit: limit, sort: { timestamp: -1 } }
    ).toArray();
  }

  static async getStoreUsageHistory(storeId, limit = 50) {
    const collection = await this.getCollection();
    return await collection.find(
      { store_id: new ObjectId(storeId) },
      { limit: limit, sort: { timestamp: -1 } }
    ).toArray();
  }

  static async getContractUsageHistory(contractId, limit = 50) {
    const collection = await this.getCollection();
    return await collection.find(
      { contract_id: new ObjectId(contractId) },
      { limit: limit, sort: { timestamp: -1 } }
    ).toArray();
  }

  static async getUsageByAction(contractId, action, startDate, endDate) {
    const collection = await this.getCollection();
    
    const query = {
      contract_id: new ObjectId(contractId),
      action: action
    };
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    return await collection.find(query).toArray();
  }

  static async getUsageStats(contractId, period = '30d') {
    const collection = await this.getCollection();
    
    const daysAgo = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);
    
    const pipeline = [
      {
        $match: {
          contract_id: new ObjectId(contractId),
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$action',
          total_credits: { $sum: '$credits_consumed' },
          usage_count: { $sum: 1 },
          avg_credits_per_use: { $avg: '$credits_consumed' }
        }
      }
    ];
    
    return await collection.aggregate(pipeline).toArray();
  }

  // Credit pricing according to STRIPE_PAYMENTS.md
  static getCreditPackages() {
    return [
      { credits: 10, price: 1000, description: '$10 = 10 credits' }, // 10¢ per credit
      { credits: 25, price: 2500, description: '$25 = 25 credits' }, // 10¢ per credit  
      { credits: 50, price: 4150, description: '$50 = 50 credits' }, // 8.3¢ per credit
      { credits: 100, price: 7700, description: '$100 = 100 credits' }, // 7.7¢ per credit
      { credits: 250, price: 17750, description: '$250 = 250 credits' }, // 7.1¢ per credit
    ];
  }

  // Credit consumption rates according to STRIPE_PAYMENTS.md
  static getCreditCosts() {
    return {
      // Email Generation
      'simple_email': 1,
      'personalized_email': 2,
      'multi_variant_campaign': 3,
      'campaign_series': 10, // 5 emails
      
      // AI Recommendations  
      'content_suggestions': 1,
      'audience_segmentation': 2,
      'performance_predictions': 1,
      
      // Content Optimization
      'grammar_check': 0.5,
      'image_suggestions': 1,
      'ab_test_variations': 2,
    };
  }

  static async checkCreditsBeforeAction(storeId, action) {
    const creditCosts = this.getCreditCosts();
    const creditsNeeded = creditCosts[action] || 1;
    
    const currentBalance = await this.getStoreBalance(storeId);
    
    return {
      has_credits: currentBalance >= creditsNeeded,
      credits_needed: creditsNeeded,
      current_balance: currentBalance,
      credits_after: currentBalance - creditsNeeded
    };
  }
}
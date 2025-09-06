// This is a compatibility wrapper for the Mongoose Contract model
// It provides the same interface as the old ContractModel class

import Contract from '../models/Contract.js';

export class ContractModel {
  static async getCollection() {
    // Return Contract model for compatibility
    return Contract;
  }

  static async createContract(contractData) {
    const contract = new Contract(contractData);
    return await contract.save();
  }

  static async getContractById(contractId) {
    return await Contract.findById(contractId);
  }

  static async updateContract(contractId, updates) {
    return await Contract.findByIdAndUpdate(contractId, updates, { new: true });
  }

  static async deleteContract(contractId) {
    return await Contract.findByIdAndDelete(contractId);
  }

  static async getContractsByUser(userId) {
    return await Contract.find({ owner_id: userId });
  }

  static async incrementStoreCount(contractId) {
    const contract = await Contract.findById(contractId);
    if (!contract) {
      throw new Error('Contract not found');
    }
    return await contract.incrementStoreCount();
  }

  static async decrementStoreCount(contractId) {
    const contract = await Contract.findById(contractId);
    if (!contract) {
      throw new Error('Contract not found');
    }
    return await contract.decrementStoreCount();
  }

  static async addCredits(contractId, credits, operation = 'purchase') {
    const contract = await Contract.findById(contractId);
    if (!contract) {
      throw new Error('Contract not found');
    }
    return await contract.addCredits(credits, operation);
  }

  static async canCreateStore(contractId) {
    const contract = await Contract.findById(contractId);
    if (!contract) {
      throw new Error('Contract not found');
    }
    return contract.canCreateStore();
  }
}

// Export default for compatibility
export default ContractModel;
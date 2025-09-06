import mongoose from "mongoose";
import { ObjectId } from "mongodb";

const ContractSeatSchema = new mongoose.Schema({
  contract_id: {
    type: ObjectId,
    ref: "Contract",
    required: true
  },
  user_id: {
    type: ObjectId,
    ref: "User",
    required: true
  },
  default_role_id: {
    type: ObjectId,
    ref: "Role",
    required: true
  },
  store_access: [{
    store_id: {
      type: ObjectId,
      ref: "Store",
      required: true
    },
    role_id: {
      type: ObjectId,
      ref: "Role"
    },
    permission_overrides: {
      type: Map,
      of: Boolean,
      default: new Map()
    },
    granted_by: {
      type: ObjectId,
      ref: "User"
    },
    granted_at: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'revoked'],
    default: 'active'
  },
  invited_by: {
    type: ObjectId,
    ref: "User"
  },
  invitation_email: {
    type: String,
    trim: true
  },
  invitation_sent_at: {
    type: Date
  },
  activated_at: {
    type: Date
  },
  suspended_at: {
    type: Date
  },
  suspended_by: {
    type: ObjectId,
    ref: "User"
  },
  revoked_at: {
    type: Date
  },
  revoked_by: {
    type: ObjectId,
    ref: "User"
  },
  metadata: {
    type: Map,
    of: String,
    default: new Map()
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for better query performance
ContractSeatSchema.index({ contract_id: 1, user_id: 1 }, { unique: true });
ContractSeatSchema.index({ user_id: 1, status: 1 });
ContractSeatSchema.index({ contract_id: 1, status: 1 });
ContractSeatSchema.index({ 'store_access.store_id': 1 });
ContractSeatSchema.index({ status: 1 });
ContractSeatSchema.index({ invited_by: 1 });

// Static method to find seats by contract
ContractSeatSchema.statics.findByContract = function(contractId) {
  return this.find({ 
    contract_id: contractId, 
    status: 'active' 
  }).populate('user_id default_role_id');
};

// Static method to find seats by user
ContractSeatSchema.statics.findByUser = function(userId) {
  return this.find({ 
    user_id: userId, 
    status: 'active' 
  }).populate('contract_id default_role_id');
};

// Static method to find user's seat for a specific contract
ContractSeatSchema.statics.findUserSeatForContract = function(userId, contractId) {
  return this.findOne({
    user_id: userId,
    contract_id: contractId,
    status: 'active'
  }).populate('default_role_id');
};

// Static method to find user's access to a specific store
ContractSeatSchema.statics.findUserAccessToStore = async function(userId, storeId) {
  const Store = mongoose.model('Store');
  const store = await Store.findById(storeId);
  
  if (!store) return null;
  
  return this.findOne({
    user_id: userId,
    contract_id: store.contract_id,
    status: 'active',
    $or: [
      { 'store_access.store_id': storeId },
      { 'store_access': { $size: 0 } } // No specific store restrictions means access to all
    ]
  }).populate('default_role_id');
};

// Instance method to check if seat has access to a specific store
ContractSeatSchema.methods.hasStoreAccess = function(storeId) {
  // If no specific store access defined, user has access to all stores in contract
  if (!this.store_access || this.store_access.length === 0) {
    return true;
  }
  
  // Check if store is in the access list
  return this.store_access.some(access => 
    access.store_id.toString() === storeId.toString()
  );
};

// Instance method to get role for a specific store
ContractSeatSchema.methods.getStoreRole = function(storeId) {
  const storeAccess = this.store_access.find(access => 
    access.store_id.toString() === storeId.toString()
  );
  
  // Return store-specific role if exists, otherwise default role
  return storeAccess?.role_id || this.default_role_id;
};

// Instance method to grant store access
ContractSeatSchema.methods.grantStoreAccess = function(storeId, roleId, grantedBy) {
  // Check if already has access
  const existingAccess = this.store_access.find(access => 
    access.store_id.toString() === storeId.toString()
  );
  
  if (existingAccess) {
    // Update existing access
    existingAccess.role_id = roleId || existingAccess.role_id;
    existingAccess.granted_by = grantedBy;
    existingAccess.granted_at = new Date();
  } else {
    // Add new access
    this.store_access.push({
      store_id: storeId,
      role_id: roleId || this.default_role_id,
      granted_by: grantedBy,
      granted_at: new Date()
    });
  }
};

// Instance method to revoke store access
ContractSeatSchema.methods.revokeStoreAccess = function(storeId) {
  this.store_access = this.store_access.filter(access => 
    access.store_id.toString() !== storeId.toString()
  );
};

// Instance method to suspend seat
ContractSeatSchema.methods.suspend = async function(suspendedBy) {
  this.status = 'suspended';
  this.suspended_at = new Date();
  this.suspended_by = suspendedBy;
  return this.save();
};

// Instance method to reactivate seat
ContractSeatSchema.methods.reactivate = async function() {
  this.status = 'active';
  this.suspended_at = undefined;
  this.suspended_by = undefined;
  return this.save();
};

// Instance method to revoke seat
ContractSeatSchema.methods.revoke = async function(revokedBy) {
  this.status = 'revoked';
  this.revoked_at = new Date();
  this.revoked_by = revokedBy;
  
  // Update user's active_seats
  const User = mongoose.model('User');
  const user = await User.findById(this.user_id);
  if (user) {
    user.removeSeat(this.contract_id);
    await user.save();
  }
  
  return this.save();
};

// Static method to create seat for user
ContractSeatSchema.statics.createSeat = async function(contractId, userId, roleId, invitedBy) {
  // Check if seat already exists
  const existingSeat = await this.findOne({
    contract_id: contractId,
    user_id: userId
  });
  
  if (existingSeat) {
    if (existingSeat.status === 'revoked') {
      // Reactivate revoked seat
      existingSeat.status = 'active';
      existingSeat.default_role_id = roleId;
      existingSeat.activated_at = new Date();
      existingSeat.revoked_at = undefined;
      existingSeat.revoked_by = undefined;
      return existingSeat.save();
    } else {
      throw new Error('User already has a seat in this contract');
    }
  }
  
  // Create new seat
  const seat = new this({
    contract_id: contractId,
    user_id: userId,
    default_role_id: roleId,
    invited_by: invitedBy,
    status: 'active',
    activated_at: new Date()
  });
  
  await seat.save();
  
  // Update user's active_seats
  const User = mongoose.model('User');
  const Contract = mongoose.model('Contract');
  const [user, contract] = await Promise.all([
    User.findById(userId),
    Contract.findById(contractId)
  ]);
  
  if (user && contract) {
    user.addSeat(contractId, contract.contract_name, seat._id);
    await user.save();
  }
  
  return seat;
};

// Prevent model recompilation in development
let ContractSeat;

if (mongoose.models && mongoose.models.ContractSeat) {
  ContractSeat = mongoose.models.ContractSeat;
} else {
  ContractSeat = mongoose.model("ContractSeat", ContractSeatSchema);
}

export default ContractSeat;
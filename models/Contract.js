import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import { generateNanoid } from '../lib/nanoid-generator.js';

const ContractSchema = new mongoose.Schema({
  // Basic Information
  public_id: {
    type: String
  },
  contract_name: {
    type: String,
    required: true,
    trim: true,
  },
  billing_email: {
    type: String,
    required: true,
    trim: true,
  },
  
  // Ownership
  owner_id: {
    type: ObjectId,
    ref: "User",
    required: true,
  },
  billing_contact_id: {
    type: ObjectId,
    ref: "User",
    required: true
  },
  parent_contract_id: {
    type: ObjectId,
    ref: "Contract",
    default: null
  },
  
  // Billing
  stripe_customer_id: {
    type: String,
    required: true,
    trim: true
  },
  subscription: {
    stripe_subscription_id: {
      type: String
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'past_due', 'trialing', 'incomplete'],
      default: 'trialing'
    },
    tier: {
      type: String,
      enum: ['starter', 'growth', 'pro', 'enterprise'],
      default: 'starter'
    },
    price_per_month: {
      type: Number,
      default: 0
    },
    trial_ends_at: Date
  },
  
  // Store Limits
  stores: {
    max_allowed: {
      type: Number,
      default: 1
    },
    price_per_additional: {
      type: Number,
      default: 29
    },
    active_count: {
      type: Number,
      default: 0
    }
  },
  
  // AI Credits
  ai_credits: {
    monthly_included: {
      type: Number,
      default: 100
    },
    current_balance: {
      type: Number,
      default: 100,
      min: 0
    },
    rollover_enabled: {
      type: Boolean,
      default: false
    },
    purchased_packages: [{
      package_id: String,
      credits: Number,
      price_paid: Number,
      purchased_at: {
        type: Date,
        default: Date.now
      },
      expires_at: Date
    }],
    usage_history: [{
      user_id: {
        type: ObjectId,
        ref: 'User'
      },
      seat_id: {
        type: ObjectId,
        ref: 'ContractSeat'
      },
      credits_used: Number,
      operation: String, // 'generate', 'analyze', 'optimize'
      used_at: {
        type: Date,
        default: Date.now
      }
    }]
  },
  
  // Features
  features: {
    white_label: {
      type: Boolean,
      default: false
    },
    custom_domain: {
      type: String,
      default: null
    },
    api_access: {
      type: Boolean,
      default: false
    },
    sso_enabled: {
      type: Boolean,
      default: false
    },
    advanced_analytics: {
      type: Boolean,
      default: false
    },
    priority_support: {
      type: Boolean,
      default: false
    }
  },
  
  // Legacy features field for backward compatibility
  features_enabled: [{
    type: String,
    enum: [
      'stores',
      'analytics',
      'campaigns',
      'ai_basic',
      'ai_advanced',
      'multi_account',
      'reports',
      'email_builder',
      'permissions'
    ],
    default: ['stores', 'analytics', 'campaigns', 'ai_basic']
  }],
  
  // Status
  status: {
    type: String,
    enum: ['active', 'suspended', 'cancelled'],
    default: 'active'
  },
  
  // Legacy status fields for backward compatibility
  is_active: {
    type: Boolean,
    default: true
  },
  is_deleted: {
    type: Boolean,
    default: false
  },
  deleted_at: {
    type: Date,
    default: null,
  },
  deleted_by: {
    type: ObjectId,
    ref: "User",
    default: null,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Pre-save hook to generate public_id
ContractSchema.pre('save', async function(next) {
  if (this.isNew && !this.public_id) {
    this.public_id = await generateNanoid(8); // 8 characters for contracts
  }
  next();
});

// Indexes for better query performance
ContractSchema.index({ public_id: 1 }, { unique: true });
ContractSchema.index({ owner_id: 1 });
ContractSchema.index({ billing_contact_id: 1 });
ContractSchema.index({ parent_contract_id: 1 });
ContractSchema.index({ stripe_customer_id: 1 });
ContractSchema.index({ 'subscription.stripe_subscription_id': 1 });
ContractSchema.index({ status: 1 });
ContractSchema.index({ is_active: 1, is_deleted: 1 });

// Static method to find contracts by user (updated for new architecture)
ContractSchema.statics.findByUser = function (userId) {
  return this.find({
    $or: [
      { owner_id: userId },
      { billing_contact_id: userId }
    ],
    status: 'active',
    is_deleted: false
  });
};

// Static method to find contracts accessible via ContractSeats
ContractSchema.statics.findByUserSeats = async function (userId) {
  const ContractSeat = mongoose.model('ContractSeat');
  const seats = await ContractSeat.find({ 
    user_id: userId, 
    status: 'active' 
  }).populate('contract_id');
  
  return seats.map(seat => seat.contract_id).filter(contract => contract);
};

// Static method to check if user has access to contract (updated for ContractSeat)
ContractSchema.statics.hasAccess = async function (contractId, userId, requiredRole = "member") {
  const contract = await this.findById(contractId);
  if (!contract) return false;

  // Check if user is owner or billing contact
  if (contract.owner_id.toString() === userId.toString() ||
      contract.billing_contact_id.toString() === userId.toString()) {
    return true;
  }

  // Check via ContractSeat
  const ContractSeat = mongoose.model('ContractSeat');
  const seat = await ContractSeat.findOne({
    contract_id: contractId,
    user_id: userId,
    status: 'active'
  }).populate('default_role_id');

  if (!seat) return false;
  
  // TODO: Implement role hierarchy checking
  return true;
};

// Method to get active seats for this contract
ContractSchema.methods.getActiveSeats = function () {
  const ContractSeat = mongoose.model('ContractSeat');
  return ContractSeat.findByContract(this._id);
};

// Method to add user to contract
ContractSchema.methods.addUser = async function (userId, roleId, invitedBy) {
  const ContractSeat = mongoose.model('ContractSeat');
  
  // Check if seat already exists
  const existingSeat = await ContractSeat.findOne({
    contract_id: this._id,
    user_id: userId
  });
  
  if (existingSeat) {
    throw new Error('User already has a seat in this contract');
  }
  
  // Create new seat
  const seat = new ContractSeat({
    contract_id: this._id,
    user_id: userId,
    default_role_id: roleId,
    invited_by: invitedBy,
    status: 'active'
  });
  
  await seat.save();
  
  // Update user's active_seats
  const User = mongoose.model('User');
  const user = await User.findById(userId);
  if (user) {
    user.addSeat(this._id, this.contract_name, seat._id);
    await user.save();
  }
  
  return seat;
};

// Method to remove user from contract
ContractSchema.methods.removeUser = async function (userId) {
  const ContractSeat = mongoose.model('ContractSeat');
  
  const seat = await ContractSeat.findOne({
    contract_id: this._id,
    user_id: userId
  });
  
  if (seat) {
    seat.status = 'revoked';
    await seat.save();
    
    // Update user's active_seats
    const User = mongoose.model('User');
    const user = await User.findById(userId);
    if (user) {
      user.removeSeat(this._id);
      await user.save();
    }
  }
};

// Method to add credits (updated for new schema)
ContractSchema.methods.addCredits = async function (credits, operation = 'purchase', packageInfo = {}) {
  if (operation === 'purchase') {
    this.ai_credits.current_balance += credits;
    
    // Add to purchased packages
    this.ai_credits.purchased_packages.push({
      package_id: packageInfo.package_id || `pkg_${Date.now()}`,
      credits: credits,
      price_paid: packageInfo.price_paid || 0,
      purchased_at: new Date(),
      expires_at: packageInfo.expires_at || null
    });
    
    // Update legacy fields for backward compatibility
    if (this.ai_credits_balance !== undefined) {
      this.ai_credits_balance += credits;
    }
    if (this.ai_credits_purchased !== undefined) {
      this.ai_credits_purchased += credits;
    }
  }
  
  await this.save();
  return this.ai_credits.current_balance;
};

// Method to consume credits (new)
ContractSchema.methods.consumeCredits = async function (credits, userId, seatId, operation = 'generate') {
  if (this.ai_credits.current_balance < credits) {
    throw new Error('Insufficient AI credits');
  }
  
  this.ai_credits.current_balance -= credits;
  
  // Record usage
  this.ai_credits.usage_history.push({
    user_id: userId,
    seat_id: seatId,
    credits_used: credits,
    operation: operation,
    used_at: new Date()
  });
  
  // Update legacy fields for backward compatibility
  if (this.ai_credits_balance !== undefined) {
    this.ai_credits_balance -= credits;
  }
  if (this.ai_credits_used !== undefined) {
    this.ai_credits_used += credits;
  }
  
  await this.save();
  return this.ai_credits.current_balance;
};

// Method to check if contract can create more stores (updated for new schema)
ContractSchema.methods.canCreateStore = function () {
  const activeCount = this.stores?.active_count ?? this.current_stores_count ?? 0;
  const maxAllowed = this.stores?.max_allowed ?? this.max_stores ?? 1;
  return activeCount < maxAllowed;
};

// Method to increment store count (updated for new schema)
ContractSchema.methods.incrementStoreCount = async function () {
  if (!this.canCreateStore()) {
    throw new Error(`Contract has reached maximum store limit (${this.stores.max_allowed})`);
  }
  this.stores.active_count += 1;
  
  // Update legacy field for backward compatibility
  if (this.current_stores_count !== undefined) {
    this.current_stores_count += 1;
  }
  
  return await this.save();
};

// Method to decrement store count (updated for new schema)
ContractSchema.methods.decrementStoreCount = async function () {
  if (this.stores.active_count > 0) {
    this.stores.active_count -= 1;
    
    // Update legacy field for backward compatibility
    if (this.current_stores_count !== undefined && this.current_stores_count > 0) {
      this.current_stores_count -= 1;
    }
    
    return await this.save();
  }
};

// Soft delete method
ContractSchema.methods.softDelete = async function (deletedBy) {
  this.is_deleted = true;
  this.deleted_at = new Date();
  this.deleted_by = deletedBy;
  await this.save();
};

// Prevent model recompilation in development
let Contract;

if (mongoose.models && mongoose.models.Contract) {
  Contract = mongoose.models.Contract;
} else {
  Contract = mongoose.model("Contract", ContractSchema);
}

export default Contract;
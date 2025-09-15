import mongoose from 'mongoose';

const SupportTicketSchema = new mongoose.Schema({
  ticket_id: {
    type: String,
    required: true,
    unique: true,
    default: () => `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  },
  type: {
    type: String,
    required: true,
    enum: ['bug', 'feature', 'question'],
    index: true
  },
  status: {
    type: String,
    required: true,
    enum: ['open', 'in_progress', 'resolved', 'closed', 'archived'],
    default: 'open',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  subject: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 5000
  },
  attachments: [{
    url: String,
    type: String, // 'image', 'file'
    filename: String,
    size: Number,
    uploaded_at: {
      type: Date,
      default: Date.now
    }
  }],
  user: {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    email: String,
    name: String
  },
  store: {
    store_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store'
    },
    store_name: String,
    store_public_id: String
  },
  metadata: {
    browser: String,
    os: String,
    screen_resolution: String,
    user_agent: String,
    url: String, // Page where ticket was submitted
    ip_address: String
  },
  responses: [{
    responder: {
      user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      name: String,
      role: {
        type: String,
        enum: ['support', 'admin', 'superuser']
      }
    },
    message: String,
    attachments: [{
      url: String,
      type: String,
      filename: String,
      size: Number
    }],
    created_at: {
      type: Date,
      default: Date.now
    }
  }],
  internal_notes: [{
    author: {
      user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      name: String
    },
    note: String,
    created_at: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [String],
  resolved_at: Date,
  closed_at: Date,
  first_response_at: Date,
  satisfaction_rating: {
    score: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String,
    rated_at: Date
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  updated_at: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Indexes for efficient querying
SupportTicketSchema.index({ 'user.email': 1 });
SupportTicketSchema.index({ created_at: -1 });
SupportTicketSchema.index({ type: 1, status: 1 });
SupportTicketSchema.index({ priority: 1, status: 1 });
SupportTicketSchema.index({ 'store.store_public_id': 1 });

// Virtual for response time
SupportTicketSchema.virtual('response_time').get(function() {
  if (this.first_response_at && this.created_at) {
    return this.first_response_at - this.created_at;
  }
  return null;
});

// Virtual for resolution time
SupportTicketSchema.virtual('resolution_time').get(function() {
  if (this.resolved_at && this.created_at) {
    return this.resolved_at - this.created_at;
  }
  return null;
});

// Method to add a response
SupportTicketSchema.methods.addResponse = async function(responder, message, attachments = []) {
  this.responses.push({
    responder,
    message,
    attachments
  });
  
  if (!this.first_response_at) {
    this.first_response_at = new Date();
  }
  
  if (this.status === 'open') {
    this.status = 'in_progress';
  }
  
  return this.save();
};

// Method to add internal note
SupportTicketSchema.methods.addInternalNote = async function(author, note) {
  this.internal_notes.push({
    author,
    note
  });
  
  return this.save();
};

// Method to resolve ticket
SupportTicketSchema.methods.resolve = async function() {
  this.status = 'resolved';
  this.resolved_at = new Date();
  return this.save();
};

// Method to close ticket
SupportTicketSchema.methods.close = async function() {
  this.status = 'closed';
  this.closed_at = new Date();
  return this.save();
};

// Static method to get ticket stats
SupportTicketSchema.statics.getStats = async function(filter = {}) {
  const pipeline = [
    { $match: filter },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
        in_progress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
        bugs: { $sum: { $cond: [{ $eq: ['$type', 'bug'] }, 1, 0] } },
        features: { $sum: { $cond: [{ $eq: ['$type', 'feature'] }, 1, 0] } },
        questions: { $sum: { $cond: [{ $eq: ['$type', 'question'] }, 1, 0] } },
        avg_response_time: { $avg: '$response_time' },
        avg_resolution_time: { $avg: '$resolution_time' }
      }
    }
  ];
  
  const results = await this.aggregate(pipeline);
  return results[0] || {};
};

const SupportTicket = mongoose.models.SupportTicket || mongoose.model('SupportTicket', SupportTicketSchema);

export default SupportTicket;
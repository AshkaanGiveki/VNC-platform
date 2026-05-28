/**
 * Log model – immutable audit trail for all significant actions.
 * Written asynchronously via RabbitMQ consumer for performance.
 * @module models/Log
 */
const mongoose = require('mongoose');

const logSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null, // null for platform events
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    action: {
      type: String,
      required: true,
      maxlength: 100,
    },
    resource: {
      type: String,
      required: true,
      maxlength: 100,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ip: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
  },
  {
    timestamps: false, // we use timestamp explicitly
  }
);

// Compound indexes for filtering and pagination
logSchema.index({ timestamp: -1 });
logSchema.index({ organizationId: 1, action: 1 });
logSchema.index({ userId: 1, timestamp: -1 });

// Optional TTL index to automatically remove logs after e.g. 90 days (uncomment if needed)
// logSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

const Log = mongoose.model('Log', logSchema);

module.exports = Log;
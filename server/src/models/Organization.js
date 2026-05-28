/**
 * Organization model – represents a tenant using the platform.
 * @module models/Organization
 */
const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    domain: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true, // allows multiple nulls without violating unique index
    },
    defaultPolicy: {
      filePersistence: { type: Boolean, default: false },
      clipboard: { type: Boolean, default: true },
      audio: { type: Boolean, default: true },
      webcam: { type: Boolean, default: false },
      microphone: { type: Boolean, default: false },
      downloadEnabled: { type: Boolean, default: false },
      uploadEnabled: { type: Boolean, default: true },
      maxSessionDuration: {
        type: Number,
        default: 0, // 0 = unlimited
        min: 0,
      },
    },
    settings: {
      maxUsers: {
        type: Number,
        default: 100,
        min: 1,
      },
      maxSessionsPerUser: {
        type: Number,
        default: 5,
        min: 1,
      },
      recordingEnabled: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for domain lookups
organizationSchema.index({ domain: 1 }, { unique: true, sparse: true });

const Organization = mongoose.model('Organization', organizationSchema);

module.exports = Organization;
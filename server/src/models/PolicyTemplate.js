/**
 * PolicyTemplate model – reusable policy configuration for workspaces.
 * Each organization can have multiple templates; only one can be marked as default.
 * @module models/PolicyTemplate
 */
const mongoose = require('mongoose');

const policyTemplateSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 300,
      default: '',
    },
    options: {
      filePersistence: { type: Boolean, default: false },
      clipboard: { type: Boolean, default: true },
      audio: { type: Boolean, default: true },
      webcam: { type: Boolean, default: false },
      microphone: { type: Boolean, default: false },
      downloadEnabled: { type: Boolean, default: false },
      uploadEnabled: { type: Boolean, default: true },
      maxSessionDuration: { type: Number, default: 0, min: 0 },
      maxConcurrentSessions: { type: Number, default: 2, min: 1 },
      blockedIps: [{ type: String }],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one default per organization
policyTemplateSchema.index(
  { organizationId: 1, isDefault: 1 },
  { unique: true, partialFilterExpression: { isDefault: true } }
);

// Pre-save hook: if marked as default, unset any other defaults in the org
policyTemplateSchema.pre('save', async function (next) {
  if (this.isModified('isDefault') && this.isDefault) {
    await mongoose.model('PolicyTemplate').updateMany(
      { organizationId: this.organizationId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

const PolicyTemplate = mongoose.model('PolicyTemplate', policyTemplateSchema);

module.exports = PolicyTemplate;
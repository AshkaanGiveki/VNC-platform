/**
 * Workspace model – a template combining an image, resources, and a policy.
 * Admins create workspaces and assign them to users via UserWorkspace.
 * @module models/Workspace
 */
const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Workspace name is required'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 500,
      default: '',
    },
    imageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Image',
      required: true,
    },
    resources: {
      cpu: {
        type: Number,
        required: true,
        min: 0.1,
        default: 1,
      },
      memory: {
        type: Number, // MB
        required: true,
        min: 128,
        default: 1024,
      },
      disk: {
        type: Number, // GB
        required: true,
        min: 1,
        default: 10,
      },
    },
    policy: {
      templateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PolicyTemplate',
        default: null,
      },
      overrides: {
        filePersistence: { type: Boolean, default: undefined },
        clipboard: { type: Boolean, default: undefined },
        audio: { type: Boolean, default: undefined },
        webcam: { type: Boolean, default: undefined },
        microphone: { type: Boolean, default: undefined },
        downloadEnabled: { type: Boolean, default: undefined },
        uploadEnabled: { type: Boolean, default: undefined },
        maxSessionDuration: { type: Number, min: 0, default: undefined },
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for listing org workspaces
workspaceSchema.index({ organizationId: 1, isActive: 1 });

const Workspace = mongoose.model('Workspace', workspaceSchema);

module.exports = Workspace;
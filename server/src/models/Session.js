/**
 * Session model – a running instance of a workspace for a user.
 * Captures the container identifier, current status, and a snapshot of the policy at launch time.
 * @module models/Session
 */
const mongoose = require('mongoose');
const { SESSION_STATUS } = require('../utils/constants');

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    containerId: {
      type: String,
      required: true,
    },
    accessUrl: {
      type: String,
      required: true,
    },
    websocketUrl: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(SESSION_STATUS),
      default: SESSION_STATUS.STARTING,   
    },
    policySnapshot: {
      filePersistence: Boolean,
      clipboard: Boolean,
      audio: Boolean,
      webcam: Boolean,
      microphone: Boolean,
      downloadEnabled: Boolean,
      uploadEnabled: Boolean,
      maxSessionDuration: Number,
    },
    resources: {
      cpu: Number,
      memory: Number, // MB
      disk: Number,   // GB
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    stoppedAt: {
      type: Date,
      default: null,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
    recordingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recording',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for quick lookups
sessionSchema.index({ userId: 1, status: 1 });
sessionSchema.index({ workspaceId: 1, userId: 1 });
sessionSchema.index({ organizationId: 1, status: 1 });

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
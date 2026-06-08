/**
 * Recording model – metadata for session recordings stored in object storage.
 * Tracks processing status and duration.
 * @module models/Recording
 */
const mongoose = require('mongoose');
const { RECORDING_STATUS } = require('../utils/constants');

const recordingSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    storagePath: {
      type: String,
      default: '',
    },
    duration: {
      type: Number, // seconds
      default: 0,
      min: 0,
    },
    size: {
      type: Number, // bytes
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(RECORDING_STATUS),
      default: RECORDING_STATUS.RECORDING,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    finishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index to list recordings for an organization
recordingSchema.index({ organizationId: 1, createdAt: -1 });
// Index for user's recordings
recordingSchema.index({ userId: 1, createdAt: -1 });

const Recording = mongoose.model('Recording', recordingSchema);

module.exports = Recording;
/**
 * SessionFile – metadata for files uploaded or downloaded during a session.
 * Actual files reside in object storage; this document provides a link.
 * @module models/SessionFile
 */
const mongoose = require('mongoose');

const sessionFileSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fileName: {
      type: String,
      required: true,
      maxlength: 255,
    },
    fileSize: {
      type: Number, // bytes
      required: true,
      min: 0,
    },
    mimeType: {
      type: String,
      default: 'application/octet-stream',
    },
    storagePath: {
      type: String, // key in object storage
      required: true,
    },
    direction: {
      type: String,
      enum: ['upload', 'download'],
      required: true,
    },
  },
  {
    timestamps: true, // createdAt acts as upload time
  }
);

// Index to list all files of a session
sessionFileSchema.index({ sessionId: 1, createdAt: -1 });

const SessionFile = mongoose.model('SessionFile', sessionFileSchema);

module.exports = SessionFile;
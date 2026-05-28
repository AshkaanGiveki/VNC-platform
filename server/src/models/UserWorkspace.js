/**
 * UserWorkspace – many-to-many linking between users and workspaces.
 * Tracks which workspace is assigned to which user and by whom.
 * @module models/UserWorkspace
 */
const mongoose = require('mongoose');

const userWorkspaceSchema = new mongoose.Schema(
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
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt – useful for audit
  }
);

// Prevent duplicate assignment
userWorkspaceSchema.index({ userId: 1, workspaceId: 1 }, { unique: true });

// Index for querying all workspaces of a user
userWorkspaceSchema.index({ userId: 1, organizationId: 1 });

const UserWorkspace = mongoose.model('UserWorkspace', userWorkspaceSchema);

module.exports = UserWorkspace;
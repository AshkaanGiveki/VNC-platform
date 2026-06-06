const Workspace = require('../models/Workspace');
const UserWorkspace = require('../models/UserWorkspace');
const Image = require('../models/Image');
const User = require('../models/User');
const { NotFoundError, AuthorizationError, ConflictError, ValidationError } = require('../utils/errors');
const { ROLES } = require('../utils/constants');
const { logAction } = require('./log.service');
const logger = require('../utils/logger');

/**
 * Create a new workspace.
 */
async function createWorkspace({ actor, organizationId, data }) {
  if (![ROLES.ORG_ADMIN, ROLES.MANAGER].includes(actor.role)) {
    throw new AuthorizationError('Insufficient permissions to create workspaces');
  }

  // Verify image exists and is enabled
  const image = await Image.findById(data.imageId);
  if (!image || !image.isEnabled) {
    throw new NotFoundError('Image not found or disabled');
  }

  // Build workspace data
  const workspaceData = {
    name: data.name,
    description: data.description,
    imageId: data.imageId,
    resources: data.resources,
    isActive: data.isActive,
    organizationId,
  };

  // Handle policy assignment
  if (data.policyId) {
    workspaceData.policy = {
      templateId: data.policyId,
      overrides: data.policyOverrides || {},
    };
  } else if (data.policy) {
    workspaceData.policy = data.policy;
  }

  const workspace = await Workspace.create(workspaceData);

  logger.info(`Workspace created: ${workspace.name}`);
  await logAction({
    action: 'workspace.created',
    resource: 'workspace',
    resourceId: workspace._id,
    userId: actor.userId,
    organizationId,
  });

  return workspace;
}

/**
 * List workspaces in an organization.
 */
async function listWorkspaces(organizationId, queryParams) {
  const { parsePagination, applyPagination, buildMeta } = require('../utils/pagination');
  const pagination = parsePagination(queryParams);

  const filter = { organizationId, isActive: true };
  if (queryParams.imageId) filter.imageId = queryParams.imageId;

  const [workspaces, total] = await Promise.all([
    applyPagination(Workspace.find(filter).populate('imageId', 'name type').populate('policy.templateId', 'name'), pagination).lean(),
    Workspace.countDocuments(filter),
  ]);

  return { workspaces, meta: buildMeta(total, pagination) };
}

/**
 * Get workspace by ID.
 */
async function getWorkspace(workspaceId, organizationId) {
  const workspace = await Workspace.findOne({ _id: workspaceId, organizationId })
    .populate('imageId')
    .populate('policy.templateId', 'name options');
  if (!workspace) throw new NotFoundError('Workspace not found');
  return workspace;
}

/**
 * Update workspace.
 */
async function updateWorkspace({ actor, workspaceId, organizationId, updates }) {
  if (![ROLES.ORG_ADMIN, ROLES.MANAGER].includes(actor.role)) {
    throw new AuthorizationError('Insufficient permissions');
  }

  // Handle policy update
  if (updates.policyId) {
    updates.policy = {
      templateId: updates.policyId,
      overrides: updates.policyOverrides || {},
    };
    delete updates.policyId;
    delete updates.policyOverrides;
  }

  const workspace = await Workspace.findOneAndUpdate(
    { _id: workspaceId, organizationId },
    updates,
    { new: true, runValidators: true }
  );
  if (!workspace) throw new NotFoundError('Workspace not found');

  logger.info(`Workspace updated: ${workspace.name}`);
  await logAction({
    action: 'workspace.updated',
    resource: 'workspace',
    resourceId: workspace._id,
    userId: actor.userId,
    organizationId,
  });

  return workspace;
}

/**
 * Soft-delete workspace (set inactive)
 */
async function deleteWorkspace({ actor, workspaceId, organizationId }) {
  if (![ROLES.ORG_ADMIN, ROLES.MANAGER].includes(actor.role)) {
    throw new AuthorizationError('Insufficient permissions');
  }

  const workspace = await Workspace.findOne({ _id: workspaceId, organizationId });
  if (!workspace) throw new NotFoundError('Workspace not found');

  workspace.isActive = false;
  await workspace.save();

  logger.warn(`Workspace deactivated: ${workspace.name}`);
  await logAction({
    action: 'workspace.deleted',
    resource: 'workspace',
    resourceId: workspace._id,
    userId: actor.userId,
    organizationId,
  });
}

/**
 * Assign a workspace to a user.
 */
async function assignWorkspaceToUser({ actor, workspaceId, userId, organizationId }) {
  if (!userId || userId.length !== 24) {
    throw new ValidationError('Invalid user ID');
  }
  if (![ROLES.ORG_ADMIN, ROLES.MANAGER].includes(actor.role)) {
    throw new AuthorizationError('Insufficient permissions');
  }

  const targetUser = await User.findById(userId);
  if (!targetUser) throw new NotFoundError('User not found');
  if (targetUser.role !== ROLES.USER) {
    throw new AuthorizationError('Only regular users can be assigned to workspaces');
  }

  const [workspace, user] = await Promise.all([
    Workspace.findOne({ _id: workspaceId, organizationId, isActive: true }),
    User.findOne({ _id: userId, organizationId, isActive: true }),
  ]);
  if (!workspace) throw new NotFoundError('Workspace not found or inactive');
  if (!user) throw new NotFoundError('User not found or inactive');

  const existing = await UserWorkspace.findOne({ userId, workspaceId });
  if (existing) {
    throw new ConflictError('فضای کاری از قبل به این کاربر اختصاص داده شده است');
  }

  await UserWorkspace.create({
    userId,
    workspaceId,
    organizationId,
    assignedBy: actor.userId,
  });

  logger.info(`Workspace ${workspace.name} assigned to user ${user.email}`);
  await logAction({
    action: 'workspace.assigned',
    resource: 'userWorkspace',
    resourceId: workspaceId,
    userId: actor.userId,
    organizationId,
    details: { assignedUserId: userId },
  });
}

/**
 * Revoke workspace from a user.
 */
async function revokeWorkspace({ actor, workspaceId, userId, organizationId }) {
  if (![ROLES.ORG_ADMIN, ROLES.MANAGER].includes(actor.role)) {
    throw new AuthorizationError('Insufficient permissions');
  }

  const assignment = await UserWorkspace.findOneAndDelete({ userId, workspaceId, organizationId });
  if (!assignment) throw new NotFoundError('Assignment not found');

  logger.info(`Workspace ${workspaceId} revoked from user ${userId}`);
  await logAction({
    action: 'workspace.revoked',
    resource: 'userWorkspace',
    resourceId: workspaceId,
    userId: actor.userId,
    organizationId,
    details: { revokedUserId: userId },
  });
}

module.exports = {
  createWorkspace,
  listWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  assignWorkspaceToUser,
  revokeWorkspace,
};
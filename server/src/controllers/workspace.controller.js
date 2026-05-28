/**
 * Workspace controller – CRUD and assignment operations.
 * @module controllers/workspace.controller
 */
const workspaceService = require('../services/workspace.service');
const { success, paginated } = require('../utils/response');

const createWorkspace = async (req, res, next) => {
  try {
    const workspace = await workspaceService.createWorkspace({
      actor: req.user,
      organizationId: req.params.orgId,
      data: req.body,
    });
    return success(res, workspace, 201);
  } catch (err) {
    next(err);
  }
};

const listWorkspaces = async (req, res, next) => {
  try {
    const { workspaces, meta } = await workspaceService.listWorkspaces(
      req.params.orgId,
      req.query
    );
    return paginated(res, workspaces, meta);
  } catch (err) {
    next(err);
  }
};

const getWorkspace = async (req, res, next) => {
  try {
    const workspace = await workspaceService.getWorkspace(req.params.id, req.params.orgId);
    return success(res, workspace);
  } catch (err) {
    next(err);
  }
};

const updateWorkspace = async (req, res, next) => {
  try {
    const workspace = await workspaceService.updateWorkspace({
      actor: req.user,
      workspaceId: req.params.id,
      organizationId: req.params.orgId,
      updates: req.body,
    });
    return success(res, workspace);
  } catch (err) {
    next(err);
  }
};

const deleteWorkspace = async (req, res, next) => {
  try {
    await workspaceService.deleteWorkspace({
      actor: req.user,
      workspaceId: req.params.id,
      organizationId: req.params.orgId,
    });
    return success(res, null, 204);
  } catch (err) {
    next(err);
  }
};

const assignWorkspace = async (req, res, next) => {
  try {
    await workspaceService.assignWorkspaceToUser({
      actor: req.user,
      workspaceId: req.params.id,
      userId: req.body.userId,
      organizationId: req.params.orgId,
    });
    return success(res, { message: 'Workspace assigned successfully' }, 200);
  } catch (err) {
    next(err);
  }
};

const revokeWorkspace = async (req, res, next) => {
  try {
    await workspaceService.revokeWorkspace({
      actor: req.user,
      workspaceId: req.params.id,
      userId: req.params.userId,
      organizationId: req.params.orgId,
    });
    return success(res, null, 204);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createWorkspace,
  listWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  assignWorkspace,
  revokeWorkspace,
};
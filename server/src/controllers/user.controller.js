/**
 * User controller – user management inside an organization.
 * @module controllers/user.controller
 */
const userService = require('../services/user.service');
const { success, paginated } = require('../utils/response');
const UserWorkspace = require('../models/UserWorkspace');

const createUser = async (req, res, next) => {
  if (actor.role === ROLES.ORG_ADMIN && (userData.role && userData.role !== ROLES.USER)) {
    throw new AuthorizationError('Admins can only create regular users');
  }
  try {
    console.log(req.user);
    const user = await userService.createUser({
      actor: req.user,
      organizationId: req.params.orgId,
      userData: req.body,
    });
    return success(res, user, 201);
  } catch (err) {
    next(err);
  }
};

const listUsers = async (req, res, next) => {
  try {
    const { users, meta } = await userService.listUsers({
      organizationId: req.params.orgId,
      queryParams: req.query,
    });
    return paginated(res, users, meta);
  } catch (err) {
    next(err);
  }
};

const getUser = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.userId, req.params.orgId);
    return success(res, user);
  } catch (err) {
    next(err);
  }
};

// const updateUser = async (req, res, next) => {
//   if (actor.role === ROLES.ORG_ADMIN && updates.role) {
//     throw new AuthorizationError('Admins cannot change roles');
//   }
//   if (actor.role === ROLES.ORG_ADMIN) {
//     const targetUser = await User.findById(userId);
//     if (!targetUser) throw new NotFoundError('User not found');
//     if (targetUser.role !== ROLES.USER) {
//       throw new AuthorizationError('Admins can only modify regular users');
//     }
//   }
//   try {
//     const user = await userService.updateUser({
//       actor: req.user,
//       userId: req.params.userId,
//       updates: req.body,
//     });
//     return success(res, user);
//   } catch (err) {
//     next(err);
//   }
// };
const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser({
      actor: req.user,
      userId: req.params.userId,
      updates: req.body,
    });
    return success(res, user);
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser({
      actor: req.user,
      userId: req.params.userId,
    });
    return success(res, null, 204);
  } catch (err) {
    next(err);
  }
};


const getMyWorkspaces = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const assignments = await UserWorkspace.find({ userId })
      .populate({
        path: 'workspaceId',
        match: { isActive: true },
        populate: { path: 'imageId', select: 'name type' }
      })
      .lean();

    const workspaces = assignments.map((a) => a.workspaceId).filter(Boolean);
    return success(res, workspaces, 200);
  } catch (err) {
    next(err);
  }
};


module.exports = { createUser, getMyWorkspaces, listUsers, getUser, updateUser, deleteUser };
/**
 * User controller – user management inside an organization.
 * @module controllers/user.controller
 */
const userService = require('../services/user.service');
const { success, paginated } = require('../utils/response');
const UserWorkspace = require('../models/UserWorkspace');
const User = require('../models/User');

const createUser = async (req, res, next) => {
  try {
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
        populate: { path: 'imageId', select: 'name type iconUrl' }
      })
      .lean();

    const workspaces = assignments.map((a) => a.workspaceId).filter(Boolean);
    return success(res, workspaces, 200);
  } catch (err) {
    next(err);
  }
};
const getAllUsers = async (req, res, next) => {
  try {
    const { parsePagination, applyPagination, buildMeta } = require('../utils/pagination');
    const pagination = parsePagination(req.query);
    const filter = {};

    if (req.query.role) {
      const roles = req.query.role.split(',').map(r => r.trim());
      filter.role = { $in: roles };
    }

    if (req.query.search) {
      const searchStr = req.query.search.trim();
      if (searchStr.includes(' ')) {
        const escaped = searchStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filter.$expr = {
          $regexMatch: {
            input: { $concat: ['$firstName', ' ', '$lastName'] },
            regex: escaped,
            options: 'i',
          },
        };
      } else {
        filter.$or = [
          { firstName: { $regex: searchStr, $options: 'i' } },
          { lastName: { $regex: searchStr, $options: 'i' } },
          { email: { $regex: searchStr, $options: 'i' } },
        ];
      }
    }

    const [users, total] = await Promise.all([
      applyPagination(
        User.find(filter).populate('organizationId', 'name').sort({ createdAt: -1 }),
        pagination
      ).lean(),
      User.countDocuments(filter),
    ]);

    return paginated(res, users, buildMeta(total, pagination));
  } catch (err) {
    next(err);
  }
};


module.exports = { createUser, getMyWorkspaces, listUsers, getUser, updateUser, deleteUser, getAllUsers };
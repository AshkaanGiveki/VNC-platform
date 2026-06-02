/**
 * Organization controller (superadmin actions).
 * @module controllers/organization.controller
 */

const orgService = require('../services/organization.service');
const Organization = require('../models/Organization');   // ← ADD THIS
const User = require('../models/User');
const { ROLES } = require('../utils/constants');
const { success } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');


const create = async (req, res, next) => {
  try {
    const org = await orgService.createOrganization(req.body);
    return success(res, org, 201);
  } catch (err) {
    next(err);
  }
};

const createWithAdmin = async (req, res, next) => {
  try {
    // Create organization
    const org = await orgService.createOrganization(req.body.organization);

    // If admin details provided, create an org_admin user
    if (req.body.admin) {
      await require('../services/user.service').createUser({
        actor: req.user, // superadmin
        organizationId: org._id.toString(),
        userData: {
          ...req.body.admin,
          role: 'org_admin',
        },
      });
    }

    return success(res, { organization: org }, 201);
  } catch (err) {
    next(err);
  }
};

const createWithManager = async (req, res, next) => {
  try {
    // Create organization
    const org = await orgService.createOrganization(req.body);
    // Create manager user
    const userService = require('../services/user.service');
    await userService.createUser({
      actor: req.user, // superadmin
      organizationId: org._id.toString(),
      userData: {
        ...req.body.manager,
        role: 'manager',
      },
    });
    return success(res, { organization: org }, 201);
  } catch (err) {
    next(err);
  }
};

const getAll = async (req, res, next) => {
  try {
    const orgs = await orgService.getAllOrganizations();
    return success(res, orgs);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const org = await orgService.getOrganizationById(req.params.id);
    return success(res, org);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const org = await orgService.updateOrganization(req.params.id, req.body);
    return success(res, org);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await orgService.deleteOrganization(req.params.id);
    return success(res, null, 204);
  } catch (err) {
    next(err);
  }
};


const updateManager = async (req, res, next) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) throw new NotFoundError('Organization not found');

    const manager = await User.findOne({ organizationId: org._id, role: ROLES.MANAGER });
    if (!manager) throw new NotFoundError('Manager not found');

    const updates = req.body;
    if (updates.password) manager.password = updates.password;
    if (updates.email) manager.email = updates.email;
    if (updates.firstName) manager.firstName = updates.firstName;
    if (updates.lastName) manager.lastName = updates.lastName;
    if (typeof updates.isActive === 'boolean') manager.isActive = updates.isActive;

    await manager.save();
    return success(res, { manager });
  } catch (err) {
    next(err);
  }
};

const getManager = async (req, res, next) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) throw new NotFoundError('Organization not found');

    const manager = await User.findOne({ organizationId: org._id, role: ROLES.MANAGER }).select('-password -refreshTokens');
    if (!manager) throw new NotFoundError('Manager not found');

    return success(res, { manager });
  } catch (err) {
    next(err);
  }
};

module.exports = { create, createWithAdmin, createWithManager, getAll, getById, update, remove , updateManager, getManager };
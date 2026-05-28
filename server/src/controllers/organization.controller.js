/**
 * Organization controller (superadmin actions).
 * @module controllers/organization.controller
 */
const orgService = require('../services/organization.service');
const { success } = require('../utils/response');

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

module.exports = { create, createWithAdmin, getAll, getById, update, remove };
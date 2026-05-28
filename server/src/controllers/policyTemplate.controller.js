/**
 * Policy template controller.
 * @module controllers/policyTemplate.controller
 */
const policyService = require('../services/policy.service');
const { success, paginated } = require('../utils/response');

const createTemplate = async (req, res, next) => {
  try {
    const template = await policyService.createTemplate({
      actor: req.user,
      organizationId: req.params.orgId,
      data: req.body,
    });
    return success(res, template, 201);
  } catch (err) {
    next(err);
  }
};

const listTemplates = async (req, res, next) => {
  try {
    const templates = await policyService.listTemplates(req.params.orgId);
    return success(res, templates);
  } catch (err) {
    next(err);
  }
};

const getTemplate = async (req, res, next) => {
  try {
    const template = await policyService.getTemplate(req.params.id, req.params.orgId);
    return success(res, template);
  } catch (err) {
    next(err);
  }
};

const updateTemplate = async (req, res, next) => {
  try {
    const template = await policyService.updateTemplate({
      actor: req.user,
      templateId: req.params.id,
      organizationId: req.params.orgId,
      updates: req.body,
    });
    return success(res, template);
  } catch (err) {
    next(err);
  }
};

const deleteTemplate = async (req, res, next) => {
  try {
    await policyService.deleteTemplate({
      actor: req.user,
      templateId: req.params.id,
      organizationId: req.params.orgId,
    });
    return success(res, null, 204);
  } catch (err) {
    next(err);
  }
};

const setDefaultTemplate = async (req, res, next) => {
  try {
    const template = await policyService.setDefaultTemplate({
      actor: req.user,
      templateId: req.params.id,
      organizationId: req.params.orgId,
    });
    return success(res, template);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTemplate,
  listTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate,
};
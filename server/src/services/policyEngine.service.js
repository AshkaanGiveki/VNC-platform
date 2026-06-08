/**
 * Policy Engine – evaluates workspace policy options for a given session or action.
 * Merges policy template, overrides, and organization defaults.
 * @module services/policyEngine.service
 */
const { POLICY_OPTIONS } = require('../utils/constants');
const PolicyTemplate = require('../models/PolicyTemplate');
const Organization = require('../models/Organization');

/**
 * Resolve the effective policy for a workspace.
 * Priority: Workspace overrides > PolicyTemplate > Organization default.
 *
 * @param {object} workspace - Workspace document (populated with policy.templateId if needed)
 * @returns {Promise<object>} Resolved policy object with all flags set.
 */
async function resolvePolicy(workspace) {
  // Start with a safe baseline (all false / unlimited)
  const defaultPolicy = {
    filePersistence: false,
    clipboard: true,
    audio: true,
    webcam: false,
    microphone: false,
    downloadEnabled: false,
    uploadEnabled: true,
    maxSessionDuration: 0,
    blockedIps: [],
  };

  // 1. Try to get organization default
  if (workspace.organizationId) {
    const org = await Organization.findById(workspace.organizationId).select('defaultPolicy').lean();
    if (org && org.defaultPolicy) {
      Object.assign(defaultPolicy, org.defaultPolicy);
    }
  }

  // 2. Apply template if present
  if (workspace.policy && workspace.policy.templateId) {
    const template = await PolicyTemplate.findById(workspace.policy.templateId).lean();
    if (template && template.options) {
      Object.assign(defaultPolicy, template.options);
    }
  }

  // 3. Apply workspace overrides (only non‑undefined values)
  if (workspace.policy && workspace.policy.overrides) {
    Object.keys(workspace.policy.overrides).forEach(key => {
      if (workspace.policy.overrides[key] !== undefined) {
        defaultPolicy[key] = workspace.policy.overrides[key];
      }
    });
  }

  return defaultPolicy;
}

/**
 * Check if a specific action is allowed by the effective policy.
 *
 * @param {object} policy - Resolved policy object.
 * @param {string} action - One of the POLICY_OPTIONS or custom check.
 * @returns {boolean}
 */
function isAllowed(policy, action) {
  switch (action) {
    case POLICY_OPTIONS.FILE_PERSISTENCE:
      return policy.filePersistence === true;
    case POLICY_OPTIONS.CLIPBOARD:
      return policy.clipboard !== false; // default true
    case POLICY_OPTIONS.UPLOAD_ENABLED:
      return policy.uploadEnabled !== false;
    case POLICY_OPTIONS.DOWNLOAD_ENABLED:
      return policy.downloadEnabled === true;
    case POLICY_OPTIONS.MAX_SESSION_DURATION:
      // Returns the duration value; 0 means unlimited
      return policy.maxSessionDuration || 0;
    default:
      // For other options just return the flag value or false
      return policy[action] === true;
  }
}

module.exports = { resolvePolicy, isAllowed };
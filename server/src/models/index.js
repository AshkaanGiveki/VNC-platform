/**
 * Barrel export for all Mongoose models.
 * Import from './models' to get all models at once.
 * @module models
 */
const Organization = require('./Organization');
const User = require('./User');
const Image = require('./Image');
const PolicyTemplate = require('./PolicyTemplate');
const Workspace = require('./Workspace');
const UserWorkspace = require('./UserWorkspace');
const Session = require('./Session');
const SessionFile = require('./SessionFile');
const Notification = require('./Notification');
const Log = require('./Log');
const Recording = require('./Recording');

module.exports = {
  Organization,
  User,
  Image,
  PolicyTemplate,
  Workspace,
  UserWorkspace,
  Session,
  SessionFile,
  Notification,
  Log,
  Recording,
};
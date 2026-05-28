/**
 * Centralised configuration aggregator.
 * Imports all specialised config modules and exports a single frozen object.
 * @module config
 */
const env = require('./env');
const database = require('./database');
const redis = require('./redis');
const rabbitmq = require('./rabbitmq');
const storage = require('./storage');

const config = {
  env,
  database,
  redis,
  rabbitmq,
  storage,
};

module.exports = Object.freeze(config);
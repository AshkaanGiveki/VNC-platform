/**
 * Health check controller – reports DB, Redis, RabbitMQ connectivity.
 * @module controllers/health.controller
 */
const mongoose = require('mongoose');
const redisClient = require('../config/redis');
const { getChannel } = require('../config/rabbitmq');

const healthCheck = async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'ok',
    checks: {
      mongo: 'ok',
      redis: 'ok',
      rabbitmq: 'ok',
    },
  };

  let overallStatus = 200;

  // Check MongoDB
  if (mongoose.connection.readyState !== 1) {
    health.checks.mongo = 'disconnected';
    health.status = 'degraded';
    overallStatus = 503;
  }

  // Check Redis
  try {
    await redisClient.ping();
  } catch (err) {
    health.checks.redis = 'error';
    health.status = 'degraded';
    overallStatus = 503;
  }

  // Check RabbitMQ
  try {
    const channel = getChannel();
    await channel.checkExchange('logs');
  } catch (err) {
    health.checks.rabbitmq = 'error';
    health.status = 'degraded';
    overallStatus = 503;
  }

  return res.status(overallStatus).json(health);
};

module.exports = { healthCheck };
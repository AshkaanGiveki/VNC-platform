/**
 * Kasm Workspaces API client (stub).
 * Implements the same container orchestrator interface as Docker provider.
 * @module integrations/kasm/kasm.client
 */
const logger = require('../../utils/logger');
const { AppError } = require('../../utils/errors');

/**
 * Launch a container via Kasm.
 * @param {object} params
 * @param {string} params.image - Kasm image name (e.g. "ubuntu")
 * @param {object} params.resources - { cpu, memory, disk }
 * @param {object} params.environment - Additional env vars
 * @returns {Promise<{containerId: string, url: string, websocketUrl?: string}>}
 */
async function launchContainer({ image, resources, environment }) {
  // In production, call Kasm API to create a workspace
  logger.warn('Kasm client is a stub – returning fake container');
  // Simulate an ID and URL
  const containerId = `kasm-${Date.now()}`;
  const url = `https://kasm.example.com/#/connect/${containerId}`;
  return { containerId, url };
}

async function stopContainer(containerId) {
  logger.info(`Stopping Kasm container ${containerId}`);
  // Kasm API call
}

async function pauseContainer(containerId) {
  logger.info(`Pausing Kasm container ${containerId}`);
}

async function resumeContainer(containerId) {
  logger.info(`Resuming Kasm container ${containerId}`);
}

async function deleteContainer(containerId) {
  logger.info(`Deleting Kasm container ${containerId}`);
}

/** Optional recording endpoints */
async function startRecording(containerId) {}
async function stopRecording(containerId) {}

module.exports = {
  launchContainer,
  stopContainer,
  pauseContainer,
  resumeContainer,
  deleteContainer,
  startRecording,
  stopRecording,
};
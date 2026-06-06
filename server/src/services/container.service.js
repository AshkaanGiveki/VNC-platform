/**
 * Container service – abstracts the underlying container orchestrator.
 * @module services/container.service
 */
const config = require('../config');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

let provider = null;

function getProvider() {
  if (provider) return provider;
  const providerName = config.env.containerProvider || 'docker'; // default docker
  if (providerName === 'kasm') {
    provider = require('../integrations/kasm/kasm.client');
  } else if (providerName === 'docker') {
    provider = require('../integrations/containerOrchestrator/docker');
  } else {
    throw new AppError(`Unknown container provider: ${providerName}`, 500);
  }
  return provider;
}

async function launchContainer({ image, resources, policy, user, workspaceId }) {
  const prov = getProvider();
  logger.info(`Launching container for image ${image.name}`);
  // Pass volume path if policy allows file persistence
  let volumePath = null;
  if (policy.filePersistence) {
    // Use a host directory dedicated to the session/user
    volumePath = `/data/sessions/${user._id}/${workspaceId}`;
    // Ensure directory exists (handled by Docker bind mount creation)
  }
  try {
    const result = await prov.launchContainer({
      image: image.dockerImage,
      resources,
      environment: {
        USER_ID: user._id.toString(),
        WORKSPACE_ID: workspaceId.toString(),
      },
      policy,
      volumePath,
      recordable: policy.recordingEnabled || false,
    });
    return result;
  } catch (err) {
    logger.error(`Container launch failed: ${err.message}`);
    throw new AppError('Failed to launch container', 500);
  }
}


/**
 * Stop a running container.
 * @param {string} containerId
 * @returns {Promise<void>}
 */
async function stopContainer(containerId) {
  const prov = getProvider();
  logger.info(`Stopping container ${containerId}`);
  try {
    await prov.stopContainer(containerId);
  } catch (err) {
    logger.error(`Stop container failed: ${err.message}`);
    throw new AppError('Failed to stop container', 500);
  }
}

/**
 * Pause a container.
 * @param {string} containerId
 * @returns {Promise<void>}
 */
async function pauseContainer(containerId) {
  const prov = getProvider();
  try {
    await prov.pauseContainer(containerId);
  } catch (err) {
    logger.error(`Pause container failed: ${err.message}`);
    throw new AppError('Failed to pause container', 500);
  }
}

/**
 * Resume a paused container.
 * @param {string} containerId
 * @returns {Promise<void>}
 */
async function resumeContainer(containerId) {
  const prov = getProvider();
  try {
    await prov.resumeContainer(containerId);
  } catch (err) {
    logger.error(`Resume container failed: ${err.message}`);
    throw new AppError('Failed to resume container', 500);
  }
}

/**
 * Delete a container entirely.
 * @param {string} containerId
 * @returns {Promise<void>}
 */
async function deleteContainer(containerId) {
  const prov = getProvider();
  try {
    await prov.deleteContainer(containerId);
  } catch (err) {
    logger.error(`Delete container failed: ${err.message}`);
    throw new AppError('Failed to delete container', 500);
  }
}

async function startRecording(containerId) {
  const prov = getProvider();
  if (prov.startRecording) {
    await prov.startRecording(containerId);
  }
}

async function stopRecording(containerId) {
  const prov = getProvider();
  if (prov.stopRecording) {
    await prov.stopRecording(containerId);
  }
}

module.exports = {
  launchContainer,
  stopContainer,
  pauseContainer,
  resumeContainer,
  deleteContainer,
  startRecording,
  stopRecording,
};
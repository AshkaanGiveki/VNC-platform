const Docker = require('dockerode');
const fs = require('fs');
const https = require('https');
const os = require('os');
const logger = require('../../utils/logger');
const config = require('../../config');
const { AppError } = require('../../utils/errors');
const path = require('path');

function toDockerPath(winPath) {
  // Converts E:\data\… to /e/data/…
  return winPath.replace(/\\/g, '/').replace(/^(\w):/, '/$1');
}

function getDockerClient() {
  // If a DOCKER_HOST is explicitly set, use it (TCP or socket)
  if (process.env.DOCKER_HOST) {
    return new Docker({ host: process.env.DOCKER_HOST });
  }
  // On Windows, always use the named pipe – it’s more reliable than TCP
  if (os.platform() === 'win32') {
    return new Docker({ socketPath: '//./pipe/docker_engine' });
  }
  // Linux/macOS default socket
  return new Docker({ socketPath: '/var/run/docker.sock' });
}

const docker = getDockerClient();

async function ensureNetwork() {
  try {
    const nets = await docker.listNetworks({ filters: { name: ['workspace-net'] } });
    if (nets.length === 0) {
      await docker.createNetwork({ Name: 'workspace-net', Driver: 'bridge' });
      logger.info('Created Docker network: workspace-net');
    }
  } catch (err) {
    logger.error(`Network error: ${err.message}`);
  }
}
ensureNetwork();

async function ensureImage(imageName) {
  const images = await docker.listImages({ filters: { reference: [imageName] } });
  if (images.length > 0) return;
  logger.info(`Pulling image ${imageName} ...`);
  return new Promise((resolve, reject) => {
    docker.pull(imageName, (err, stream) => {
      if (err) return reject(new AppError(`Pull failed: ${err.message}`));
      docker.modem.followProgress(stream, finishErr => {
        if (finishErr) return reject(new AppError(`Pull error: ${finishErr.message}`));
        logger.info(`Image ${imageName} pulled`);
        resolve();
      });
    });
  });
}

function waitForHttps(url, timeoutMs = 60000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      https.get(url, { rejectUnauthorized: false }, res => {
        if (res.statusCode >= 200 && res.statusCode < 500) return resolve();
        tryAgain();
      }).on('error', e => {
        logger.warn(`Health check: ${e.message}`);
        tryAgain();
      });
    };
    const tryAgain = () => {
      if (Date.now() - start > timeoutMs) return reject(new AppError('Container not ready'));
      setTimeout(tryConnect, 1000);
    };
    tryConnect();
  });
}

async function launchContainer({ image, resources, environment, volumePath, policy }) {
  await ensureImage(image);

  const envVars = [
    `VNC_PW=${environment.VNC_PW || 'password'}`,
    `KASM_CLIPBOARD=${policy.clipboard !== false ? '1' : '0'}`,
    `KASM_FILE_TRANSFER=${(policy.uploadEnabled || policy.downloadEnabled) ? '1' : '0'}`,
    `KASM_UPLOAD=${policy.uploadEnabled !== false ? '1' : '0'}`,
    `KASM_DOWNLOAD=${policy.downloadEnabled !== false ? '1' : '0'}`,
    `USER_ID=${environment.USER_ID}`,
    `WORKSPACE_ID=${environment.WORKSPACE_ID}`,
    `KASM_NO_AUTH=1`,
  ];

  logger.info(`Container env vars: ${JSON.stringify(envVars)}`);

  const hostConfig = {
    NanoCpus: resources.cpu * 1e9,
    Memory: resources.memory * 1024 * 1024,
    MemorySwap: resources.memory * 1024 * 1024 * 2,
    PortBindings: { '6901/tcp': [{ HostPort: '0' }] },
    CapAdd: ['NET_ADMIN'],
    ShmSize: 2 * 1024 * 1024 * 1024,
    Binds: [],
  };

  const storageRoot = path.resolve(config.env.sessionStoragePath);
  const sessionDir = path.join(storageRoot, environment.USER_ID, environment.WORKSPACE_ID);

  const toDockerPath = (p) => {
    if (os.platform() === 'win32') {
      return p.replace(/\\/g, '/').replace(/^(\w):/, '//$1').toLowerCase();
    }
    return p;
  };

  if (volumePath) {
    const homeBind = `${toDockerPath(volumePath)}:/home/kasm-user:rw`;
    hostConfig.Binds = [homeBind];
    logger.info(`Persistent home mount: ${homeBind}`);
  } else {
    const uploadsPath = path.join(sessionDir, 'Desktop', 'Uploads');
    const downloadsPath = path.join(sessionDir, 'Desktop', 'Downloads');
    const recordingsPath = path.join(sessionDir, 'Desktop', 'Recordings');
    fs.mkdirSync(uploadsPath, { recursive: true });
    fs.mkdirSync(downloadsPath, { recursive: true });
    fs.mkdirSync(recordingsPath, { recursive: true });

    hostConfig.Binds = [
      `${toDockerPath(uploadsPath)}:/home/kasm-user/Desktop/Uploads:rw`,
      `${toDockerPath(downloadsPath)}:/home/kasm-user/Desktop/Downloads:rw`,
      `${toDockerPath(recordingsPath)}:/home/kasm-user/Desktop/Recordings:rw`
    ];
    logger.info(`Exchange mounts: ${hostConfig.Binds.join(', ')}`);
  }

  // Create and start container
  const container = await docker.createContainer({
    Image: image,
    Env: envVars,
    HostConfig: hostConfig,
    ExposedPorts: { '6901/tcp': {} },
    User: 'root',
  });

  const containerId = container.id;
  await container.start();

  const inspect = await container.inspect();
  if (!inspect.State.Running) {
    const logs = await container.logs({ stdout: true, stderr: true, tail: 30 });
    logger.error(`Container exited. Logs: ${logs.toString()}`);
    throw new AppError('Container exited immediately', 500);
  }

  const hostPort = inspect.NetworkSettings.Ports['6901/tcp'][0].HostPort;
  const url = `https://127.0.0.1:${hostPort}`;
  const websocketUrl = `wss://127.0.0.1:${hostPort}`;

  logger.info(`Waiting for container ${containerId} on port ${hostPort}...`);
  await waitForHttps(url, 60000);
  logger.info(`Container ${containerId} is ready`);

  // ── Apply network‑blocking policy ──────────────────────────────────────
  const containerObj = docker.getContainer(containerId);
  if (policy.blockedIps && policy.blockedIps.length > 0) {
    for (const ip of policy.blockedIps) {
      try {
        // Create exec instance
        const exec = await containerObj.exec({
          Cmd: ['iptables', '-A', 'OUTPUT', '-d', ip, '-j', 'DROP'],
          AttachStdout: true,
          AttachStderr: true,
          Tty: false,
        });
        // Start it and wait for completion
        const stream = await exec.start({ hijack: true, stdin: false });
        let output = '';
        stream.on('data', (chunk) => { output += chunk.toString(); });
        await new Promise((resolve, reject) => {
          stream.on('end', resolve);
          stream.on('error', reject);
        });
        if (output) logger.debug(`iptables output for ${ip}: ${output}`);
        logger.info(`Blocked IP ${ip} on container ${containerId}`);
      } catch (err) {
        logger.error(`Failed to block IP ${ip} on ${containerId}: ${err.message}`);
      }
    }
  }

  return { containerId, url, websocketUrl };
}

async function stopContainer(containerId) {
  const container = docker.getContainer(containerId);
  await container.stop({ t: 10 });
}

async function pauseContainer(containerId) {
  const container = docker.getContainer(containerId);
  await container.pause();
}

async function resumeContainer(containerId) {
  const container = docker.getContainer(containerId);
  await container.unpause();
}

async function deleteContainer(containerId) {
  const container = docker.getContainer(containerId);
  await container.remove({ force: true, v: true });
}

module.exports = {
  launchContainer,
  stopContainer,
  pauseContainer,
  resumeContainer,
  deleteContainer,
  ensureImage,
};
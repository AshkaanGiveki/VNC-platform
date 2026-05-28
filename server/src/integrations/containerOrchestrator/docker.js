// const Docker = require('dockerode');
// const fs = require('fs');
// const http = require('http');
// const os = require('os');
// const logger = require('../../utils/logger');
// const { AppError } = require('../../utils/errors');

// function getDockerClient() {
//   if (process.env.DOCKER_HOST) return new Docker({ host: process.env.DOCKER_HOST });
//   if (os.platform() === 'win32') return new Docker({ host: '127.0.0.1', port: 2375 });
//   return new Docker({ socketPath: '/var/run/docker.sock' });
// }

// const docker = getDockerClient();

// async function ensureNetwork() {
//   try {
//     const nets = await docker.listNetworks({ filters: { name: ['workspace-net'] } });
//     if (nets.length === 0) {
//       await docker.createNetwork({ Name: 'workspace-net', Driver: 'bridge' });
//       logger.info('Created network: workspace-net');
//     }
//   } catch (err) {
//     logger.error(`Network error: ${err.message}`);
//   }
// }
// ensureNetwork();

// async function ensureImage(imageName) {
//   const images = await docker.listImages({ filters: { reference: [imageName] } });
//   if (images.length > 0) return;
//   logger.info(`Pulling ${imageName}...`);
//   return new Promise((resolve, reject) => {
//     docker.pull(imageName, (err, stream) => {
//       if (err) return reject(new AppError(`Pull failed: ${err.message}`));
//       docker.modem.followProgress(stream, finishErr => {
//         if (finishErr) return reject(new AppError(`Pull error: ${finishErr.message}`));
//         logger.info(`${imageName} pulled`);
//         resolve();
//       });
//     });
//   });
// }

// function waitForHttp(url, timeoutMs = 60000) {
//   const start = Date.now();
//   return new Promise((resolve, reject) => {
//     const tryConnect = () => {
//       http.get(url, res => {
//         logger.info(`Health check: ${res.statusCode}`);
//         // 200 or 302 or 301 are fine
//         if (res.statusCode >= 200 && res.statusCode < 400) return resolve();
//         tryAgain();
//       }).on('error', e => {
//         logger.warn(`Health check: ${e.message}`);
//         tryAgain();
//       });
//     };
//     const tryAgain = () => {
//       if (Date.now() - start > timeoutMs) return reject(new AppError('Container not ready in time'));
//       setTimeout(tryConnect, 1000);
//     };
//     tryConnect();
//   });
// }

// async function launchContainer({ image, resources, environment, volumePath }) {
//   await ensureImage(image);

//   // Kasmweb 1.14+ uses VNC_PW and DATABASE_DIR
//   const envVars = [
//     'VNC_PW=',                  // empty password = no auth
//     'KASM_PORT=6901',
//     'KASM_WS_PORT=6901',
//     `USER_ID=${environment.USER_ID}`,
//     `WORKSPACE_ID=${environment.WORKSPACE_ID}`,
//     'DATABASE_DIR=/kasm_data',
//   ];

//   logger.info(`Env vars: ${JSON.stringify(envVars)}`);

//   const hostConfig = {
//     NanoCpus: resources.cpu * 1e9,
//     Memory: resources.memory * 1024 * 1024,
//     MemorySwap: resources.memory * 1024 * 1024 * 2,
//     PortBindings: { '6901/tcp': [{ HostPort: '0' }] },
//     CapAdd: ['NET_ADMIN'],
//     ShmSize: 512 * 1024 * 1024,
//     Binds: [],
//   };

//   if (volumePath) {
//     fs.mkdirSync(volumePath, { recursive: true });
//     hostConfig.Binds.push(`${volumePath}:/home/kasm-user:rw`);
//   }

//   const container = await docker.createContainer({
//     Image: image,
//     Env: envVars,
//     HostConfig: hostConfig,
//     ExposedPorts: { '6901/tcp': {} },
//   });

//   const containerId = container.id;
//   await container.start();

//   const inspect = await container.inspect();
//   if (!inspect.State.Running) {
//     const logs = await container.logs({ stdout: true, stderr: true, tail: 30 });
//     logger.error(`Container exited. Logs: ${logs.toString()}`);
//     throw new AppError('Container exited', 500);
//   }

//   const hostPort = inspect.NetworkSettings.Ports['6901/tcp'][0].HostPort;
//   const url = `http://127.0.0.1:${hostPort}`;               // plain HTTP now
//   const websocketUrl = `ws://127.0.0.1:${hostPort}`;

//   const logs = await container.logs({ stdout: true, stderr: true, tail: 20 });
//   logger.info(`Container logs:\n${logs.toString()}`);

//   logger.info(`Waiting for ${containerId} on port ${hostPort}...`);
//   await waitForHttp(url, 60000);
//   logger.info(`${containerId} ready`);

//   return { containerId, url, websocketUrl };
// }

// async function stopContainer(containerId) {
//   await docker.getContainer(containerId).stop({ t: 10 });
// }

// async function pauseContainer(containerId) {
//   await docker.getContainer(containerId).pause();
// }

// async function resumeContainer(containerId) {
//   await docker.getContainer(containerId).unpause();
// }

// async function deleteContainer(containerId) {
//   await docker.getContainer(containerId).remove({ force: true, v: true });
// }

// module.exports = {
//   launchContainer,
//   stopContainer,
//   pauseContainer,
//   resumeContainer,
//   deleteContainer,
//   ensureImage,
// };s

const Docker = require('dockerode');
const fs = require('fs');
const https = require('https');
const os = require('os');
const logger = require('../../utils/logger');
const { AppError } = require('../../utils/errors');

function getDockerClient() {
  if (process.env.DOCKER_HOST) return new Docker({ host: process.env.DOCKER_HOST });
  if (os.platform() === 'win32') return new Docker({ host: '127.0.0.1', port: 2375 });
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
  logger.info(`Pulling ${imageName}...`);
  return new Promise((resolve, reject) => {
    docker.pull(imageName, (err, stream) => {
      if (err) return reject(new AppError(`Pull failed: ${err.message}`));
      docker.modem.followProgress(stream, finishErr => {
        if (finishErr) return reject(new AppError(`Pull error: ${finishErr.message}`));
        logger.info(`${imageName} pulled`);
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
        logger.info(`Health check: ${res.statusCode}`);
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

// function waitForHttps(url, timeoutMs = 60000) {
//   const start = Date.now();
//   return new Promise((resolve, reject) => {
//     const tryConnect = () => {
//       https.get(url, { rejectUnauthorized: false }, (res) => {
//         // Any response means the container is up
//         return resolve();
//       }).on('error', (e) => {
//         if (Date.now() - start > timeoutMs)
//           return reject(new AppError('Container not ready'));
//         setTimeout(tryConnect, 1000);
//       });
//     };
//     tryConnect();
//   });
// }

async function launchContainer({ image, resources, environment, volumePath }) {
  await ensureImage(image);

  // Exactly as your working version: VNC_PW=password
  const envVars = [
    'VNC_PW=password',
    `USER_ID=${environment.USER_ID}`,
    `WORKSPACE_ID=${environment.WORKSPACE_ID}`,
  ];

  logger.info(`Env vars: ${JSON.stringify(envVars)}`);

  const hostConfig = {
    NanoCpus: resources.cpu * 1e9,
    Memory: resources.memory * 1024 * 1024,
    MemorySwap: resources.memory * 1024 * 1024 * 2,
    PortBindings: { '6901/tcp': [{ HostPort: '0' }] },
    CapAdd: ['NET_ADMIN'],
    ShmSize: 2 * 1024 * 1024 * 1024,  // 2GB shared memory (matching your working version)
    Binds: [],
  };

  if (volumePath) {
    fs.mkdirSync(volumePath, { recursive: true });
    hostConfig.Binds.push(`${volumePath}:/home/kasm-user:rw`);
  }

  const container = await docker.createContainer({
    Image: image,
    Tty: true,
    Env: envVars,
    HostConfig: hostConfig,
    ExposedPorts: { '6901/tcp': {} },
  });

  const containerId = container.id;
  await container.start();

  const inspect = await container.inspect();
  if (!inspect.State.Running) {
    const logs = await container.logs({ stdout: true, stderr: true, tail: 30 });
    logger.error(`Container exited. Logs: ${logs.toString()}`);
    throw new AppError('Container exited', 500);
  }

  const hostPort = inspect.NetworkSettings.Ports['6901/tcp'][0].HostPort;

  // Container serves HTTPS, so the accessUrl is https://127.0.0.1:port
  const url = `https://127.0.0.1:${hostPort}`;
  const websocketUrl = `wss://127.0.0.1:${hostPort}`;

  const logs = await container.logs({ stdout: true, stderr: true, tail: 20 });
  logger.info(`Container logs:\n${logs.toString()}`);

  logger.info(`Waiting for ${containerId} on port ${hostPort}...`);
  await waitForHttps(url, 60000);
  logger.info(`${containerId} ready`);

  return { containerId, url, websocketUrl };
}

async function stopContainer(containerId) {
  await docker.getContainer(containerId).stop({ t: 10 });
}

async function pauseContainer(containerId) {
  await docker.getContainer(containerId).pause();
}

async function resumeContainer(containerId) {
  await docker.getContainer(containerId).unpause();
}

async function deleteContainer(containerId) {
  await docker.getContainer(containerId).remove({ force: true, v: true });
}

module.exports = {
  launchContainer,
  stopContainer,
  pauseContainer,
  resumeContainer,
  deleteContainer,
  ensureImage,
};
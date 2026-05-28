/**
 * Mock container orchestrator for local development.
 * Launches a simple HTTP server for each session so the proxy can forward requests.
 * @module integrations/containerOrchestrator/mock
 */
const http = require('http');
const logger = require('../../utils/logger');

// Keep track of mock servers so we can stop them later
const mockServers = new Map();

async function launchContainer({ image, resources, environment, volumePath }) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <!DOCTYPE html>
        <html lang="fa" dir="rtl">
        <head><meta charset="UTF-8"><title>فضای کاری شبیه‌سازی شده</title></head>
        <body style="font-family: sans-serif; padding: 20px; text-align: center;">
          <h1>✅ فضای کاری مجازی فعال است</h1>
          <p>تصویر: ${image}</p>
          <p>این یک محیط شبیه‌سازی شده برای توسعه است.</p>
          <p>شناسه کاربر: ${environment.USER_ID}</p>
          <p>شناسه فضای کاری: ${environment.WORKSPACE_ID}</p>
        </body>
        </html>
      `);
    });

    // Listen on a random available port
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      const containerId = `mock-${Date.now()}`;
      mockServers.set(containerId, server);
      logger.info(`Mock container started on port ${port} (id: ${containerId})`);
      resolve({
        containerId,
        url: `http://127.0.0.1:${port}`,
        websocketUrl: null,
      });
    });

    server.on('error', reject);
  });
}

async function stopContainer(containerId) {
  const server = mockServers.get(containerId);
  if (server) {
    server.close();
    mockServers.delete(containerId);
    logger.info(`Mock container ${containerId} stopped`);
  }
}

async function pauseContainer(containerId) {
  // Mock pause – no action needed
}

async function resumeContainer(containerId) {
  // Mock resume – no action needed
}

async function deleteContainer(containerId) {
  await stopContainer(containerId);
}

async function startRecording(containerId) {
  logger.info(`Mock recording started for ${containerId}`);
}

async function stopRecording(containerId) {
  logger.info(`Mock recording stopped for ${containerId}`);
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
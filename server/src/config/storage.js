const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, CreateBucketCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const logger = require('../utils/logger');
const env = require('./env');
const http = require('http');

let s3Client;

function getStorageClient() {
  if (!s3Client) {
    s3Client = new S3Client({
      region: 'us-east-1',
      endpoint: `${env.storage.useSSL ? 'https' : 'http'}://${env.storage.endpoint}:${env.storage.port}`,
      credentials: {
        accessKeyId: env.storage.accessKey,
        secretAccessKey: env.storage.secretKey,
      },
      forcePathStyle: true,
    });
    logger.info(`Storage client initialised (${env.storage.endpoint}:${env.storage.port})`);
  }
  return s3Client;
}

/**
 * Simple connectivity test – makes an HTTP request to the MinIO endpoint.
 */
async function testConnectivity() {
  const options = {
    hostname: env.storage.endpoint,
    port: env.storage.port,
    path: '/',
    method: 'GET',
    timeout: 5000,
  };
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        logger.info(`MinIO connectivity test: HTTP ${res.statusCode}`);
        resolve(res.statusCode);
      });
    });
    req.on('error', (err) => {
      const util = require('util');
      logger.error(`MinIO connectivity test full error: ${util.inspect(err, { depth: 5 })}`);
      reject(err);
    });
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Connection timed out'));
    });
    req.end();
  });
}

/**
 * Ensure the bucket exists – create it if not.
 */
async function ensureBucket() {
  // First, test connectivity
  try {
    await testConnectivity();
  } catch (err) {
    logger.error('MinIO is not reachable:', err.message);
    return;
  }

  const client = getStorageClient();
  try {
    await client.send(new HeadBucketCommand({ Bucket: env.storage.bucket }));
    logger.info(`Bucket '${env.storage.bucket}' already exists`);
  } catch (err) {
    const util = require('util');
    logger.error('Bucket check full error:', util.inspect(err, { depth: 5 }));

    // Check if it's a "not found" error (different S3 SDKs report it differently)
    const statusCode = err.$metadata?.httpStatusCode || err.statusCode || err.Code;
    if (statusCode === 404 || err.name === 'NotFound') {
      logger.info(`Creating bucket '${env.storage.bucket}'...`);
      try {
        await client.send(new CreateBucketCommand({ Bucket: env.storage.bucket }));
        logger.info(`Bucket '${env.storage.bucket}' created`);
      } catch (createErr) {
        logger.error('Bucket creation error:', util.inspect(createErr, { depth: 5 }));
        throw createErr;
      }
    } else {
      throw err;
    }
  }
}

// Run bucket check on startup
ensureBucket().catch(err => logger.error(`Bucket setup failed: ${err.message}`));

async function uploadFile(streamOrBuffer, key, contentType) {
  const client = getStorageClient();
  const command = new PutObjectCommand({
    Bucket: env.storage.bucket,
    Key: key,
    Body: streamOrBuffer,
    ContentType: contentType,
  });
  try {
    return await client.send(command);
  } catch (err) {
    logger.error(`Storage upload error: ${err.message}`, err);
    throw err;
  }
}

async function getDownloadUrl(key, expiresIn = 3600) {
  const client = getStorageClient();
  const command = new GetObjectCommand({
    Bucket: env.storage.bucket,
    Key: key,
  });
  return getSignedUrl(client, command, { expiresIn });
}

async function deleteFile(key) {
  const client = getStorageClient();
  const command = new DeleteObjectCommand({
    Bucket: env.storage.bucket,
    Key: key,
  });
  return client.send(command);
}

module.exports = { getStorageClient, uploadFile, getDownloadUrl, deleteFile };
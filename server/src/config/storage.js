/**
 * Object storage client (MinIO / S3 compatible) using @aws-sdk/client-s3.
 * Provides upload, getSignedUrl, and delete operations.
 * @module config/storage
 */
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const logger = require('../utils/logger');
const env = require('./env');

let s3Client;

/**
 * Initialise the S3 client with credentials and endpoint.
 */
function getStorageClient() {
  if (!s3Client) {
    s3Client = new S3Client({
      region: 'us-east-1', // MinIO default region
      endpoint: `${env.storage.useSSL ? 'https' : 'http'}://${env.storage.endpoint}:${env.storage.port}`,
      credentials: {
        accessKeyId: env.storage.accessKey,
        secretAccessKey: env.storage.secretKey,
      },
      forcePathStyle: true, // Required for MinIO
    });
    logger.info('Storage client initialised');
  }
  return s3Client;
}

/**
 * Upload a file stream to the storage bucket.
 * @param {ReadableStream} stream - File stream.
 * @param {string} key - Object key (path).
 * @param {string} contentType - MIME type.
 * @returns {Promise<object>} AWS response.
 */
async function uploadFile(stream, key, contentType) {
  const client = getStorageClient();
  const command = new PutObjectCommand({
    Bucket: env.storage.bucket,
    Key: key,
    Body: stream,
    ContentType: contentType,
  });
  return client.send(command);
}

/**
 * Generate a pre‑signed URL for downloading a file.
 * @param {string} key - Object key.
 * @param {number} expiresIn - Seconds until URL expires (default 3600).
 * @returns {Promise<string>} Pre‑signed URL.
 */
async function getDownloadUrl(key, expiresIn = 3600) {
  const client = getStorageClient();
  const command = new GetObjectCommand({
    Bucket: env.storage.bucket,
    Key: key,
  });
  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Delete a file from storage.
 * @param {string} key - Object key.
 * @returns {Promise<object>}
 */
async function deleteFile(key) {
  const client = getStorageClient();
  const command = new DeleteObjectCommand({
    Bucket: env.storage.bucket,
    Key: key,
  });
  return client.send(command);
}

module.exports = { getStorageClient, uploadFile, getDownloadUrl, deleteFile };
/**
 * Application constants – roles, notification categories, policy options, etc.
 * @module utils/constants
 */

const ROLES = Object.freeze({
  SUPERADMIN: 'superadmin',
  ORG_ADMIN: 'org_admin',
  MANAGER: 'manager',
  USER: 'user',
});

const SESSION_STATUS = Object.freeze({
  STARTING: 'starting',   // <-- new
  RUNNING: 'running',
  STOPPED: 'stopped',
  PAUSED: 'paused',
  FAILED: 'failed',
});

const NOTIFICATION_CATEGORIES = Object.freeze({
  INFO: 'info',
  WARNING: 'warning',
  SESSION: 'session',
  POLICY: 'policy',
  SECURITY: 'security',
  SYSTEM: 'system',
});

const NOTIFICATION_SCOPE = Object.freeze({
  PLATFORM: 'platform',
  ORGANIZATION: 'organization',
  GROUP: 'group',
  USER: 'user',
  ADMINS: 'admins'
});

const POLICY_OPTIONS = Object.freeze({
  FILE_PERSISTENCE: 'filePersistence',
  CLIPBOARD: 'clipboard',
  AUDIO: 'audio',
  WEBCAM: 'webcam',
  MICROPHONE: 'microphone',
  DOWNLOAD_ENABLED: 'downloadEnabled',
  UPLOAD_ENABLED: 'uploadEnabled',
  MAX_SESSION_DURATION: 'maxSessionDuration',
});

const RECORDING_STATUS = Object.freeze({
  RECORDING: 'recording',
  PROCESSING: 'processing',
  READY: 'ready',
  FAILED: 'failed',
});

module.exports = {
  ROLES,
  SESSION_STATUS,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_SCOPE,
  POLICY_OPTIONS,
  RECORDING_STATUS,
};
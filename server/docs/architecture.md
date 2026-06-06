Full Stack Virtual Workspace Platform – Backend Documentation
Version 1.0 | JavaScript (Node.js + Express + MongoDB + Redis + RabbitMQ)
________________________________________
Table of Contents
1.	Introduction
2.	Architecture Overview
3.	Directory Structure
o	Root Level
o	src/ – Main Application
	config/
	models/
	controllers/
	services/
	routes/
	middleware/
	validators/
	events/
	jobs/
	utils/
	integrations/
o	tests/
o	scripts/
o	docs/
4.	Configuration & Environment
5.	Database Design (MongoDB)
o	Collections & Document Schemas
6.	API Route Design
o	Versioning
o	Endpoint List
7.	Middleware Stack
8.	Business Logic – Services Layer
9.	Event-Driven Architecture (RabbitMQ)
10.	Background Jobs (Bull + Redis)
11.	Integrations
o	Container Orchestrator (Kasm/Docker)
o	Object Storage (MinIO / S3)
12.	Logging & Monitoring
13.	Error Handling
14.	Security Considerations
15.	Deployment Notes
16.	Appendix – File by File Responsibilities
________________________________________
Introduction
This document describes the complete backend architecture of the Virtual Workspace Platform. The system serves multiple organizations, each managing their own users, virtual workspaces, and sessions. It exposes a REST API consumed by a Next.js frontend. The backend is built with Node.js, Express, MongoDB (via Mongoose), Redis, and RabbitMQ. All code is written in plain JavaScript (ES6+ modules or CommonJS) without TypeScript, but uses JSDoc for clarity.
Key features:
•	Multi tenancy with organization scoping.
•	Role based access (superadmin, org_admin, manager, user).
•	Workspace templates (image + resources + policy) assigned to users.
•	Container based sessions with lifecycle management.
•	File upload/download during sessions.
•	Audit logging and notifications across platform/org/group/individual scopes.
•	Session recordings storage and processing.
•	Policy engine for workspace behaviour (file persistence, clipboard, etc.).
•	Event driven communication via RabbitMQ and background jobs with Bull/Redis.
________________________________________
Architecture Overview
text
┌─────────────┐       ┌─────────────┐       ┌───────────────┐
│ Next.js UI  │──────▶│ Express API │──────▶│ MongoDB       │
│ (REST)      │◀──────│ (Node.js)   │       │ (Mongoose)    │
└─────────────┘       └──────┬──────┘       └───────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
              ┌─────▼──────┐   ┌──────▼──────┐
              │   Redis    │   │  RabbitMQ   │
              │ (cache,    │   │ (events,    │
              │  queues)   │   │  logs, etc) │
              └─────┬──────┘   └──────┬──────┘
                    │                 │
              ┌─────▼──────┐   ┌──────▼──────┐
              │ Bull jobs  │   │ Consumers   │
              │ (heavy     │   │ (async      │
              │  tasks)    │   │  workers)   │
              └────────────┘   └─────────────┘
•	Express handles HTTP requests/responses, routing, middleware.
•	MongoDB stores all persistent data (users, organizations, workspaces, sessions, logs, notifications).
•	Redis is used for caching, token blacklisting, rate limiting, and as the backing store for Bull job queues.
•	RabbitMQ carries asynchronous events (session start/stop, log shipping, notification dispatch), decoupling core logic from side effects.
________________________________________
Directory Structure
Root Level
Path	Description
.env	Environment variables (DB URI, Redis, RabbitMQ, JWT secret, storage keys) – never committed
.env.example	Template for required environment variables
.gitignore	Ignores node_modules, .env, uploads, logs, etc.
package.json	Project metadata, scripts, dependencies
tsconfig.json	Not used (project is plain JS, but might be kept for editor support; can be removed)
Dockerfile	Container image for the API
docker-compose.yml	Local development stack (MongoDB, Redis, RabbitMQ, MinIO)
README.md	Project overview and setup instructions
ecosystem.config.js	Optional PM2 process manager configuration
src/	All application source code
tests/	Unit & integration tests
scripts/	Utility scripts (seed, migration)
docs/	Documentation (this file)
uploads/	Temporary local storage (development only)
src/ – Main Application
config/
File	Responsibility
index.js	Imports and merges all config modules, exports a single frozen config object.
database.js	Establishes Mongoose connection to MongoDB; handles reconnection, events. Exports a connectDB function.
redis.js	Creates and exports an ioredis client instance. Provides connectRedis and closeRedis utilities.
rabbitmq.js	Connects to RabbitMQ using amqplib, declares exchanges & queues, returns a channel. Exports connectRabbitMQ and getChannel.
storage.js	Configures the object storage client (MinIO / AWS S3) using the @aws-sdk/client-s3 or minio package. Exports getStorageClient and bucket name.
env.js	Validates required environment variables (using envalid or manual checks) and exports them as a clean object.
models/
All Mongoose schemas and models. Each file exports the model instance.
Model File	Collection Purpose	Key Fields
Organization.js	Stores organization (tenant) details.	name, domain, defaultPolicy (object or ref), settings, createdAt
User.js	All users regardless of role. Organization-scoped.	email, hashedPassword, role (superadmin / org_admin / manager / user), organizationId (ref Organization), isActive, lastLogin, createdAt
Image.js	Predefined virtual machine/container images available on the platform.	name, description, type (ubuntu, chrome, firefox, onlyoffice), version, isEnabled, iconUrl, dockerImage (reference to container image)
PolicyTemplate.js	Reusable sets of policy options named by org admins.	organizationId, name, options ({ filePersistence: Boolean, clipboard: Boolean, audio: Boolean, … }), isDefault (boolean flag indicating org default)
Workspace.js	A template combining an image, resource limits, and a policy.	organizationId, name, imageId (ref Image), resources ({ cpu, memory, disk }), policy (embedded object or policyTemplateId ref), isActive
UserWorkspace.js	Assignment of workspaces to specific users.	userId (ref User), workspaceId (ref Workspace), organizationId (denormalized for quick query), assignedAt, assignedBy
Session.js	Represents a started container instance for a user’s workspace.	userId, workspaceId, organizationId, containerId (external ref), status (running, stopped, paused, failed), startedAt, stoppedAt, policySnapshot, resourcesUsed, recordingId (optional ref to Recording)
SessionFile.js	Files uploaded/downloaded during a session.	sessionId, userId, fileName, fileSize, storagePath (S3/MinIO key), direction (upload / download), uploadedAt
Notification.js	All platform/org/group/user notifications.	organizationId (nullable for platform-wide), scope (platform, organization, group, user), recipientIds (array of User refs), category (info, warning, session, policy, etc.), title, body, readBy ([{ userId, readAt }]), createdAt
Log.js	Immutable audit trail for every significant action.	organizationId, userId, action (string), resource (workspace, session, user, etc.), resourceId, details (Mixed), timestamp (indexed), ip
Recording.js	Metadata for session recordings.	sessionId, organizationId, userId, storagePath, duration, size, status (recording, processing, ready, failed), startedAt, finishedAt
All models include automatic _id, createdAt/updatedAt timestamps via Mongoose’s timestamps: true option.
Indexes are created per model on frequently queried fields like organizationId, userId, sessionId, timestamp.
controllers/
Each file exports an object with handler functions (one per route). They only extract request data, call the appropriate service, and return a standardized JSON response. No business logic.
Controller	Main Handlers
auth.controller.js	login, refreshToken, logout, forgotPassword, resetPassword
organization.controller.js	create, getAll, getById, update, delete (superadmin only)
user.controller.js	createUser (admin creates), listUsers, getUser, updateUser, deleteUser, changeUserRole
image.controller.js	listImages, getImage, createImage, updateImage, toggleImageStatus (platform admin)
policyTemplate.controller.js	createTemplate, listTemplates, getTemplate, updateTemplate, deleteTemplate, setDefaultTemplate (org admin)
workspace.controller.js	createWorkspace, listWorkspaces, getWorkspace, updateWorkspace, deleteWorkspace, assignWorkspaceToUser, revokeWorkspace
session.controller.js	startSession, stopSession, pauseSession, resumeSession, getSession, listUserSessions, listOrgSessions (admin)
file.controller.js	uploadFile (from session), listSessionFiles, downloadFile, deleteFile
notification.controller.js	getUserNotifications, markAsRead, markAllRead, createNotification (admin/system triggered)
log.controller.js	getLogs (filter by user, org, action, date range) – read only
recording.controller.js	getRecordings, getRecording, deleteRecording
health.controller.js	ping – returns OK if DB, Redis, RabbitMQ are connected
services/
Each file contains the business logic, data validation, and coordination between models and external services. Controllers delegate to these.
Service	Key Functions
auth.service.js	authenticateUser (verify credentials, generate JWT), refreshAccessToken, invalidateToken (add to Redis blacklist), hashPassword, comparePassword
organization.service.js	CRUD operations, setting organization’s default policy
user.service.js	Create user (ensures unique email per org, assigns role), update, soft delete, list (with pagination, role filtering). Only org admins can create users.
image.service.js	Manage platform images – admin only
policy.service.js	CRUD for policy templates, ensures at most one default per org. Also an evaluatePolicy function that merges template options with workspace overrides.
workspace.service.js	Workspace CRUD, assignment to users via UserWorkspace model, validation of image and policy existence, checking for active sessions before deletion.
session.service.js	Orchestrates session start: validates user access, checks for existing undeleted sessions on the same workspace (configurable rule), creates a Session document, calls container.service to launch container, publishes session.started event. Stop/pause/resume flow.
container.service.js	Abstraction over the underlying container orchestrator (Kasm or Docker). Implements launchContainer, stopContainer, pauseContainer, resumeContainer, getContainerStatus, deleteContainer. Hides specific API details.
file.service.js	Handles file uploads (multipart) – streams to object storage, saves metadata to SessionFile. Generates pre signed URLs for downloads.
notification.service.js	Creates notifications (with scope and recipients), dispatches them via RabbitMQ for async processing (email, push later). Also handles read receipts.
log.service.js	Provides a consistent logAction method that publishes a log event to RabbitMQ instead of writing directly (for performance). The consumer then persists to MongoDB.
recording.service.js	Manages recording metadata; after session stop, a recording job is queued to capture the stream and store it.
policyEngine.service.js	Contains the evaluation logic: given a workspace policy and an action (e.g., file persistence), returns whether it’s allowed. Used by session and file services.
routes/
Routes are versioned under v1/. The main routes/index.js combines all versioned routers and mounts them on /api.
Route File	Base Path	Key Endpoints
auth.routes.js	/api/v1/auth	POST /login, POST /refresh, POST /logout, POST /forgot-password, POST /reset-password
organization.routes.js	/api/v1/organizations	POST /, GET /, GET /:id, PUT /:id, DELETE /:id (superadmin protected)
user.routes.js	/api/v1/organizations/:orgId/users	POST /, GET /, GET /:id, PUT /:id, DELETE /:id
image.routes.js	/api/v1/images	GET /, GET /:id, POST /, PUT /:id, PATCH /:id/toggle
policyTemplate.routes.js	/api/v1/organizations/:orgId/policies	POST /, GET /, GET /:id, PUT /:id, DELETE /:id, POST /:id/set-default
workspace.routes.js	/api/v1/organizations/:orgId/workspaces	POST /, GET /, GET /:id, PUT /:id, DELETE /:id, POST /:id/assign, DELETE /:id/assign/:userId
session.routes.js	/api/v1/sessions (user scoped) and /api/v1/organizations/:orgId/sessions (admin)	POST /start, POST /:id/stop, POST /:id/pause, POST /:id/resume, GET /:id, GET / (user’s sessions), GET /org (admin filter)
file.routes.js	/api/v1/sessions/:sessionId/files	POST /upload, GET /, GET /:fileId/download, DELETE /:fileId
notification.routes.js	/api/v1/notifications	GET /, PATCH /:id/read, PATCH /read-all, POST / (admin/internal trigger)
log.routes.js	/api/v1/logs (admin only)	GET / with query filters
recording.routes.js	/api/v1/recordings	GET /, GET /:id, DELETE /:id
All routes are protected with authentication and role middleware. Organization-specific routes require the user to belong to that org (checked by organization.middleware).
middleware/
Middleware File	Purpose
auth.middleware.js	Verifies JWT from Authorization header, fetches user from cache/DB, attaches to req.user. Also checks if token is blacklisted (Redis).
role.middleware.js	Factory function: authorize(...roles) returns a middleware that checks req.user.role against allowed roles.
organization.middleware.js	Resolves the current organization from URL param :orgId or subdomain, loads org, attaches req.organization. Ensures req.user belongs to that org (unless superadmin).
validate.middleware.js	Accepts a validation schema (from validators/) and validates req.body, req.query, req.params accordingly. Returns 400 on failure.
rateLimiter.middleware.js	Implements rate limiting using express-rate-limit with Redis store. Applied globally and per route.
errorHandler.middleware.js	Central error handler – catches all thrown/next(error) errors, logs them, returns a consistent JSON error response.
requestLogger.middleware.js	Logs every incoming request (method, url, user, response time) using the configured logger.
validators/
Uses Joi for schema validation. Each file exports an object with schemas for create, update, query, etc.
•	auth.validator.js – login, refresh, password reset schemas.
•	organization.validator.js
•	user.validator.js
•	workspace.validator.js – includes resource constraints (cpu, memory numeric ranges).
•	session.validator.js
•	file.validator.js – validates file size, type.
•	notification.validator.js
•	policy.validator.js – ensures only allowed policy options are set.
events/
RabbitMQ publishers and consumers.
•	publishers/
o	sessionEvents.publisher.js – publishes session.started, session.stopped, session.paused, session.resumed to exchange sessions.
o	notification.publisher.js – publishes notification.created to exchange notifications.
o	log.publisher.js – publishes log.entry to exchange logs.
o	recording.publisher.js – publishes recording.requested to exchange recordings.
•	consumers/
o	sessionCleanup.consumer.js – listens to session.stopped, triggers resource release, recording initiation.
o	notificationDispatcher.consumer.js – listens to notification.created, eventually sends email/push notifications.
o	logWriter.consumer.js – listens to log.entry and writes to MongoDB in bulk for efficiency.
o	recordingProcessor.consumer.js – listens to recording.requested, starts the actual recording stream capture.
•	index.js – initializes all consumers on app startup.
jobs/
Uses Bull queues backed by Redis for CPU intensive or long running tasks.
•	queues/
o	sessionQueue.js – queue for session lifecycle operations (start/stop container retries, timeout handling).
o	notificationQueue.js – queue for sending batched emails or push notifications.
o	recordingQueue.js – queue for processing recordings (transcoding, thumbnail generation).
•	processors/
o	sessionProcessor.js – job handlers for the session queue.
o	notificationProcessor.js – handles actual email delivery (using Nodemailer or SendGrid).
o	recordingProcessor.js – processes recorded video files, uploads to object storage, updates Recording document.
•	scheduler.js – sets up repeatable jobs (cron like) using Bull: clean expired sessions, delete old logs, etc.
utils/
File	Responsibility
logger.js	Exports a Winston (or Pino) logger instance with different levels and transports (console, file, maybe Elasticsearch).
errors.js	Defines custom error classes: AppError, NotFoundError, AuthenticationError, AuthorizationError, ValidationError. All inherit from Error and include status codes.
response.js	Standardized response helper: success(res, data, statusCode) and fail(res, message, statusCode).
pagination.js	Utility to parse page, limit, sort query params and return Mongoose query helpers (.skip(), .limit(), etc.).
token.js	Functions to sign, verify, and decode JWTs; blacklistToken(token, expiry) adds token to Redis with TTL; isTokenBlacklisted checks Redis.
constants.js	Enums or objects for roles (ROLES), notification categories (NOTIF_CATEGORIES), policy options (POLICY_OPTIONS), session statuses.
integrations/
•	kasm/
o	kasm.client.js – HTTP client (using axios) to interact with Kasm Workspaces API: authenticate, launch Kasm, stop Kasm, get status.
o	kasm.types.js – JSDoc based type definitions for API responses (optional but helpful).
•	containerOrchestrator/
o	docker.js – Alternative implementation using Dockerode to manage containers directly.
o	kubernetes.js – Placeholder for future Kubernetes pod management.
The container.service.js picks the appropriate integration based on configuration.
________________________________________
Configuration & Environment
All environment variables are listed in .env.example:
env
# Server
PORT=3000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/workspace-platform

# Redis
REDIS_URL=redis://localhost:6379

# RabbitMQ
RABBITMQ_URL=amqp://localhost
RABBITMQ_EXCHANGE_EVENTS=events

# JWT
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Object Storage (MinIO / S3)
STORAGE_ENDPOINT=localhost
STORAGE_PORT=4410
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_BUCKET=workspace-files
STORAGE_USE_SSL=false

# Container Orchestrator
CONTAINER_PROVIDER=kasm   # or 'docker'
KASM_API_URL=https://kasm.example.com/api
KASM_API_KEY=...
The config/env.js file loads these using dotenv and validates critical ones, throwing an error if missing.
________________________________________
Database Design (MongoDB)
All data lives in a single MongoDB database. Collections are explicitly named using the models. Below are the detailed schemas (in Mongoose syntax, plain JS objects).
Organization
javascript
{
  _id: ObjectId,
  name: String,              // unique
  domain: String,            // optional custom subdomain
  defaultPolicy: {           // default policy options for the org
    filePersistence: Boolean,
    clipboard: Boolean,
    audio: Boolean,
    webcam: Boolean,
    microphone: Boolean,
    downloadEnabled: Boolean,
    uploadEnabled: Boolean,
    maxSessionDuration: Number // in minutes, 0 = unlimited
  },
  settings: {
    maxUsers: Number,
    maxSessionsPerUser: Number,
    recordingEnabled: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}
User
javascript
{
  _id: ObjectId,
  organizationId: ObjectId,   // ref Organization (null for superadmins)
  email: String,              // unique per org
  password: String,           // bcrypt hash
  role: String,               // 'superadmin' | 'org_admin' | 'manager' | 'user'
  firstName: String,
  lastName: String,
  isActive: Boolean,
  lastLogin: Date,
  passwordChangedAt: Date,
  refreshTokens: [String],    // hashed refresh tokens (optional, for rotation)
  createdAt: Date,
  updatedAt: Date
}
Index: { organizationId: 1, email: 1 } unique.
Image
javascript
{
  _id: ObjectId,
  name: String,               // "Ubuntu 22.04 Desktop"
  description: String,
  type: String,               // e.g., 'ubuntu', 'chrome', 'firefox'
  version: String,
  dockerImage: String,        // container image reference
  iconUrl: String,
  isEnabled: Boolean,
  createdAt: Date,
  updatedAt: Date
}
PolicyTemplate
javascript
{
  _id: ObjectId,
  organizationId: ObjectId,
  name: String,               // "Strict Security"
  description: String,
  options: {
    filePersistence: Boolean,
    clipboard: Boolean,
    audio: Boolean,
    webcam: Boolean,
    microphone: Boolean,
    downloadEnabled: Boolean,
    uploadEnabled: Boolean,
    maxSessionDuration: Number
  },
  isDefault: Boolean,         // only one can be true per org
  createdAt: Date,
  updatedAt: Date
}
Index: { organizationId: 1, isDefault: 1 }.
Workspace
javascript
{
  _id: ObjectId,
  organizationId: ObjectId,
  name: String,               // "Developer Desktop"
  description: String,
  imageId: ObjectId,          // ref Image
  resources: {
    cpu: Number,              // vCPUs
    memory: Number,           // MB
    disk: Number              // GB
  },
  policy: {                   // merged policy (template + overrides)
    templateId: ObjectId,     // optional ref PolicyTemplate
    overrides: {              // if any specific flag needs overriding
      filePersistence: Boolean
    }
  },
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
UserWorkspace
javascript
{
  _id: ObjectId,
  userId: ObjectId,
  workspaceId: ObjectId,
  organizationId: ObjectId,   // denormalized for efficient query
  assignedAt: Date,
  assignedBy: ObjectId        // admin who assigned
}
Unique compound index: { userId: 1, workspaceId: 1 }.
Session
javascript
{
  _id: ObjectId,
  userId: ObjectId,
  workspaceId: ObjectId,
  organizationId: ObjectId,
  containerId: String,        // external container identifier
  status: String,             // 'running' | 'stopped' | 'paused' | 'failed'
  policySnapshot: {           // policy at time of session start
    filePersistence: Boolean,
    ...
    maxSessionDuration: Number
  },
  resources: {
    cpu: Number,
    memory: Number,
    disk: Number
  },
  startedAt: Date,
  stoppedAt: Date,
  lastActivityAt: Date,
  recordingId: ObjectId,     // optional, set when recording starts
  createdAt: Date,
  updatedAt: Date
}
Indexes: { userId: 1, status: 1 }, { organizationId: 1 }, { workspaceId: 1, userId: 1 }.
SessionFile
javascript
{
  _id: ObjectId,
  sessionId: ObjectId,
  userId: ObjectId,
  fileName: String,
  fileSize: Number,           // bytes
  mimeType: String,
  storagePath: String,        // S3/MinIO key
  direction: String,          // 'upload' | 'download'
  uploadedAt: Date
}
Notification
javascript
{
  _id: ObjectId,
  organizationId: ObjectId | null, // null for platform-level
  scope: String,              // 'platform' | 'organization' | 'group' | 'user'
  recipientIds: [ObjectId],   // users to receive
  category: String,           // from constants
  title: String,
  body: String,
  readBy: [
    {
      userId: ObjectId,
      readAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
Indexes: { recipientIds: 1 }, { organizationId: 1, createdAt: -1 }.
Log
javascript
{
  _id: ObjectId,
  organizationId: ObjectId,   // can be null for platform events
  userId: ObjectId,
  action: String,             // 'user.created', 'session.started', 'file.uploaded'
  resource: String,           // 'user', 'session', 'workspace'
  resourceId: ObjectId,
  details: Mixed,             // any extra context
  ip: String,
  timestamp: Date
}
Index: { timestamp: -1 }, { organizationId: 1, action: 1 }.
Recording
javascript
{
  _id: ObjectId,
  sessionId: ObjectId,
  organizationId: ObjectId,
  userId: ObjectId,
  storagePath: String,        // video file location
  duration: Number,           // seconds
  size: Number,               // bytes
  status: String,             // 'recording' | 'processing' | 'ready' | 'failed'
  startedAt: Date,
  finishedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
________________________________________
API Route Design
Versioning
All endpoints are prefixed with /api/v1/. The frontend is expected to call these. Future breaking changes will increment the version.
Authentication
•	POST /api/v1/auth/login – body: { email, password, organization? } (org is resolved from domain or passed). Returns { accessToken, refreshToken }.
•	POST /api/v1/auth/refresh – body: { refreshToken } returns new access token.
•	POST /api/v1/auth/logout – invalidates current access & refresh tokens.
•	Password reset flow: POST /api/v1/auth/forgot-password → sends email with token; POST /api/v1/auth/reset-password with token & new password.
Organization (Superadmin)
•	POST /api/v1/organizations – create org
•	GET /api/v1/organizations – list all
•	GET /api/v1/organizations/:id
•	PUT /api/v1/organizations/:id
•	DELETE /api/v1/organizations/:id
Users (Org scoped)
All under /api/v1/organizations/:orgId/users:
•	POST / – create user (only admin/manager)
•	GET / – list users (filter, paginate)
•	GET /:userId
•	PUT /:userId
•	DELETE /:userId
•	PATCH /:userId/role – change role (admin only)
Images (Platform Admin)
•	GET /api/v1/images
•	GET /api/v1/images/:id
•	POST /api/v1/images
•	PUT /api/v1/images/:id
•	PATCH /api/v1/images/:id/toggle – enable/disable
Policy Templates (Org Admin)
•	GET /api/v1/organizations/:orgId/policies
•	POST /api/v1/organizations/:orgId/policies
•	GET /api/v1/organizations/:orgId/policies/:id
•	PUT /api/v1/organizations/:orgId/policies/:id
•	DELETE /api/v1/organizations/:orgId/policies/:id
•	POST /api/v1/organizations/:orgId/policies/:id/set-default
Workspaces (Org Admin/Manager)
•	GET /api/v1/organizations/:orgId/workspaces
•	POST /api/v1/organizations/:orgId/workspaces
•	GET /api/v1/organizations/:orgId/workspaces/:id
•	PUT /api/v1/organizations/:orgId/workspaces/:id
•	DELETE /api/v1/organizations/:orgId/workspaces/:id
•	POST /api/v1/organizations/:orgId/workspaces/:id/assign – body { userId }
•	DELETE /api/v1/organizations/:orgId/workspaces/:id/assign/:userId
Sessions
•	POST /api/v1/sessions/start – body { workspaceId } (user). The service checks access and existing sessions; if policy allows multiple sessions, may be restricted.
•	GET /api/v1/sessions – list current user’s sessions (with filters)
•	GET /api/v1/sessions/:id
•	POST /api/v1/sessions/:id/stop
•	POST /api/v1/sessions/:id/pause
•	POST /api/v1/sessions/:id/resume
•	GET /api/v1/organizations/:orgId/sessions – admin view of org sessions
Files (Session scoped)
•	POST /api/v1/sessions/:sessionId/files/upload – multipart form, returns file metadata
•	GET /api/v1/sessions/:sessionId/files – list files
•	GET /api/v1/sessions/:sessionId/files/:fileId/download – redirects to pre signed URL
•	DELETE /api/v1/sessions/:sessionId/files/:fileId
Notifications
•	GET /api/v1/notifications – user’s notifications (supports unreadOnly, category filters)
•	PATCH /api/v1/notifications/:id/read
•	PATCH /api/v1/notifications/read-all
•	POST /api/v1/notifications – internal use (triggered by system events)
Logs (Admin)
•	GET /api/v1/logs – query params: orgId, userId, action, resource, from, to, page, limit.
Recordings
•	GET /api/v1/recordings – list user’s or org’s recordings
•	GET /api/v1/recordings/:id – metadata + download link
•	DELETE /api/v1/recordings/:id
________________________________________
Middleware Stack
Middleware is applied in app.js in this order:
1.	Request Logger – logs every request.
2.	CORS – configured to allow frontend origin.
3.	Body Parser – JSON and URL encoded.
4.	Rate Limiter – global limit, with tighter limits on auth routes.
5.	Auth Middleware (on protected routes) – extracts and verifies JWT.
6.	Organization Middleware – resolves org from URL param.
7.	Role Middleware – checks user’s role for specific endpoints.
8.	Validator Middleware – validates input before controller.
9.	Routes – matched via Express Router.
10.	Error Handler – catches everything.
________________________________________
Business Logic – Services Layer
Services encapsulate all business rules:
•	User creation: Only org admin or manager can create users. Passwords are hashed with bcrypt.
•	Workspace assignment: A user cannot be assigned a workspace that belongs to a different org. Check is done.
•	Session start:
o	Validate that user’s UserWorkspace record exists.
o	Check for existing sessions with status running or paused on the same workspace. Configurable policy option allowMultipleSessions (default false) determines if a new session is allowed.
o	Load workspace policy (merge template + overrides), snapshot it into the session document.
o	Request container launch via container.service.
o	On success, update session status, publish session.started event.
•	Session stop: Stops container, updates session, publishes session.stopped. If file persistence policy is false, all session files may be deleted.
•	File upload: Only allowed if session policy uploadEnabled is true. Files are streamed to object storage; metadata saved.
•	Notifications: Created via notification.service and dispatched to RabbitMQ. The consumer then writes to DB and triggers email/push. Read receipts update the nested readBy array.
•	Audit Logs: Every service calls log.service.logAction with appropriate details. The service publishes an event rather than writing directly, ensuring non blocking API responses.
•	Policy engine: policyEngine.service provides a simple isAllowed(workspacePolicy, action) function used throughout.
________________________________________
Event-Driven Architecture (RabbitMQ)
Exchanges are topic type. Queues are bound with routing keys.
•	Exchange sessions:
o	Queue session_cleanup: key session.* → handles cleanup, recording initiation.
•	Exchange notifications:
o	Queue notification_dispatch: key notification.created → sends emails.
•	Exchange logs:
o	Queue log_writer: key log.entry → batch inserts logs.
•	Exchange recordings:
o	Queue recording_processor: key recording.requested → captures streams.
Publishers are called from services. Consumers are started in events/index.js on app boot and run in the same process (or can be separate workers in production for scalability).
________________________________________
Background Jobs (Bull + Redis)
•	Session Queue – handles:
o	session.autoStop – scheduled delayed job when maxSessionDuration is set; stops the session if still running after timeout.
o	session.retryLaunch – retries container launch on transient failures.
•	Notification Queue – batched email sending with retry and backoff. Jobs added by the notification consumer.
•	Recording Queue – takes a recording.requested event payload, pulls the stream from the container, transcodes to MP4, uploads to storage, updates the Recording document to ready.
•	Scheduler – runs every hour, cleans expired tokens from Redis blacklist, archives old logs, deletes dangling session files whose sessions are long gone.
________________________________________
Integrations
Container Orchestrator (Kasm/Docker)
container.service.js exports:
•	launchContainer(image, resources, policy) → returns { containerId, url, websocketUrl }
•	stopContainer(containerId)
•	pauseContainer(containerId)
•	resumeContainer(containerId)
•	deleteContainer(containerId)
Implementation classes (kasm.client.js or docker.js) conform to this interface. Configuration selects the active provider.
Object Storage (MinIO / S3)
storage.js uses the @aws-sdk/client-s3 or minio client. Exposes:
•	uploadFile(stream, key, metadata)
•	getSignedUrl(key, expires) for downloads
•	deleteFile(key)
________________________________________
Logging & Monitoring
utils/logger.js creates a Winston logger with:
•	Console transport (colorized in dev)
•	File transport for errors (logs/error.log)
•	Optional Elasticsearch transport for production (commented out)
Correlation IDs are attached to each request (via middleware) and included in logs.
Health checks at GET /api/v1/health report DB, Redis, RabbitMQ connectivity.
________________________________________
Error Handling
All errors are thrown as instances of classes from utils/errors.js. The global error handler in middleware/errorHandler.middleware.js catches them and returns a JSON response:
javascript
{
  success: false,
  message: error.message,
  statusCode: error.statusCode || 500,
  ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
}
Mongoose validation errors (cast errors, duplicate keys) are transformed to ValidationError instances.
________________________________________
Security Considerations
•	Passwords hashed with bcrypt (cost factor 12).
•	JWT access tokens expire in 15 minutes; refresh tokens rotate.
•	Refresh tokens are hashed before storing; revocation via deleting from DB or using a token version.
•	All tokens are verified and checked against a Redis blacklist on each request.
•	Input validation on every endpoint (Joi).
•	Rate limiting protects against brute force.
•	CORS restricted to frontend domain.
•	Organization data isolation enforced at middleware level.
•	Files are served via pre signed URLs, never exposed directly.
________________________________________
Deployment Notes
•	Dockerfile builds the Node.js app (multi stage if needed).
•	docker-compose.yml brings up all required services for local development.
•	For production, use a process manager like PM2 (config in ecosystem.config.js).
•	RabbitMQ and Redis can be clustered; credentials and connection strings come from environment.
•	MongoDB replica set recommended for production.
•	Use a reverse proxy (Nginx) to terminate TLS and forward to the Express server.
________________________________________
Appendix – File by File Responsibilities
For quick reference, every file’s primary duty is listed here (grouped by folder).
config/
•	index.js – merges and freezes config.
•	database.js – connectDB() – connects Mongoose, retries on failure.
•	redis.js – creates redisClient, connectRedis().
•	rabbitmq.js – connectRabbitMQ(), exports getChannel().
•	storage.js – creates S3/MinIO client, exports uploadFile, getSignedUrl, etc.
•	env.js – validates .env.
models/
•	Organization.js – schema + model.
•	User.js – password hashing pre save hook, instance method comparePassword.
•	Image.js – basic schema.
•	PolicyTemplate.js – ensures only one default per org via pre save hook.
•	Workspace.js – schema.
•	UserWorkspace.js – schema.
•	Session.js – schema with status enum.
•	SessionFile.js – schema.
•	Notification.js – schema with readBy array.
•	Log.js – schema with TTL index for archival.
•	Recording.js – schema.
controllers/
Each exports an object with request handlers. Thin layer – they call services and respond.
services/
As detailed in the services section; each file contains the business logic.
routes/v1/
•	index.js – aggregates all sub routers.
•	Each *.routes.js defines the routes for that resource using Express Router, applies relevant middleware.
middleware/
•	All middleware functions are standard Express middleware ((req, res, next) => { ... }).
validators/
•	Each exports Joi schemas used by validate.middleware.
events/
•	Publishers export functions that use the RabbitMQ channel to publish.
•	Consumers export an async start() function that asserts queues and binds, then consumes messages.
jobs/
•	queues/*.js export Bull queue instances.
•	processors/*.js export a function that registers process handlers.
•	scheduler.js registers repeatable jobs.
utils/
•	logger.js – Winston logger.
•	errors.js – custom error classes.
•	response.js – success, fail helpers.
•	pagination.js – paginate(query) returns { skip, limit, sort }.
•	token.js – JWT helpers + blacklist checks.
•	constants.js – all constants.
integrations/
•	kasm/kasm.client.js – implements container service interface for Kasm.
•	containerOrchestrator/docker.js – Docker alternative.
tests/
•	Unit tests under tests/unit/ – test services and utils with mocked dependencies.
•	Integration tests under tests/integration/ – spin up test DB and make HTTP requests.
•	fixtures/ – sample data for tests.
scripts/
•	seed.js – populates DB with initial superadmin, sample images, etc.
•	migrate.js – runs one off schema migrations.
•	devSetup.sh – script to start Docker services and install dependencies.


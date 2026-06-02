/**
 * Recording controller – list, get, delete recordings.
 * @module controllers/recording.controller
 */
const recordingService = require('../services/recording.service');
const { AuthorizationError } = require('../utils/errors');
const { success, paginated } = require('../utils/response');

const getRecordings = async (req, res, next) => {
  try {
    const { parsePagination, applyPagination, buildMeta } = require('../utils/pagination');
    const pagination = parsePagination(req.query);
    const filter = {};

    if (req.query.organizationId) {
      // Superadmin can view any org; manager/org_admin must belong to the org
      if (req.user.role === 'superadmin') {
        filter.organizationId = req.query.organizationId;
      } else if (req.user.role === 'manager' || req.user.role === 'org_admin') {
        if (req.user.organizationId.toString() === req.query.organizationId.toString()) {
          filter.organizationId = req.user.organizationId;
        } else {
          throw new AuthorizationError('You can only view recordings of your own organization');
        }
      }
    } else {
      // Regular user: only own recordings
      if (req.user.role === 'user') {
        filter.userId = req.user.userId;
      }
      // For superadmin without org filter, return all? We'll return all.
    }

    // Additional filters (status, etc.)
    if (req.query.status) filter.status = req.query.status;

    const [recordings, total] = await Promise.all([
      applyPagination(
        Recording.find(filter)
          .populate('userId', 'firstName lastName email')
          .sort({ createdAt: -1 }),
        pagination
      ).lean(),
      Recording.countDocuments(filter),
    ]);

    return paginated(res, recordings, buildMeta(total, pagination));
  } catch (err) {
    next(err);
  }
};

const getRecording = async (req, res, next) => {
  try {
    const recording = await recordingService.getRecording(req.params.id);
    return success(res, recording);
  } catch (err) {
    next(err);
  }
};

const deleteRecording = async (req, res, next) => {
  try {
    await recordingService.deleteRecording(req.params.id, req.user);
    return success(res, null, 204);
  } catch (err) {
    next(err);
  }
};



const startRecording = async (req, res, next) => {
  try {
    // Verify session belongs to manager's org
    const session = await Session.findById(req.params.id);
    if (!session) throw new NotFoundError('Session not found');
    if (session.organizationId.toString() !== req.user.organizationId.toString()) {
      throw new AuthorizationError('You can only record sessions in your organization');
    }
    const recording = await recordingService.startRecording(req.params.id);
    return success(res, recording, 201);
  } catch (err) {
    next(err);
  }
};

const stopRecording = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) throw new NotFoundError('Session not found');
    if (session.organizationId.toString() !== req.user.organizationId.toString()) {
      throw new AuthorizationError('Unauthorized');
    }
    const recording = await recordingService.stopRecording(req.params.id);
    return success(res, recording);
  } catch (err) {
    next(err);
  }
};


module.exports = { getRecordings, getRecording, deleteRecording, startRecording, stopRecording };
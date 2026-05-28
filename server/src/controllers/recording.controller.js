/**
 * Recording controller – list, get, delete recordings.
 * @module controllers/recording.controller
 */
const recordingService = require('../services/recording.service');
const { success, paginated } = require('../utils/response');

const getRecordings = async (req, res, next) => {
  try {
    const { recordings, meta } = await recordingService.getRecordings({
      user: req.user,
      queryParams: req.query,
      organizationId: req.params.orgId, // optional
    });
    return paginated(res, recordings, meta);
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

module.exports = { getRecordings, getRecording, deleteRecording };
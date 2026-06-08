/**
 * Recording controller – list, get, delete recordings.
 * @module controllers/recording.controller
 */
const recordingService = require('../services/recording.service');
const { AuthorizationError } = require('../utils/errors');
const { success, paginated } = require('../utils/response');
const Recording = require('../models/Recording');

const getRecordings = async (req, res, next) => {
  try {
    const { recordings, meta } = await recordingService.getRecordings({
      user: req.user,
      queryParams: req.query,
      organizationId: req.query.organizationId,
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

const startRecording = async (req, res, next) => {
  try {
    const recording = await recordingService.startRecording(req.params.id);
    return success(res, recording, 201);
  } catch (err) {
    next(err);
  }
};

const stopRecording = async (req, res, next) => {
  try {
    const recording = await recordingService.stopRecording(req.params.id);
    return success(res, recording);
  } catch (err) {
    next(err);
  }
};



module.exports = { getRecordings, getRecording, deleteRecording, startRecording, stopRecording };
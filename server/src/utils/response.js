/**
 * Standardised API response helpers.
 * Every response follows the same envelope format.
 * @module utils/response
 */

/**
 * Successful response.
 * @param {object} res – Express response object.
 * @param {*} data – The payload to send.
 * @param {number} [statusCode=200] – HTTP status code.
 */
function success(res, data, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

/**
 * Paginated response (includes metadata).
 * @param {object} res – Express response object.
 * @param {Array} data – Array of items.
 * @param {object} meta – Pagination meta (page, limit, total, totalPages).
 * @param {number} [statusCode=200] – HTTP status code.
 */
function paginated(res, data, meta, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    meta,
  });
}

/**
 * Failed response.
 * @param {object} res – Express response object.
 * @param {string} message – Error message.
 * @param {number} [statusCode=500] – HTTP status code.
 */
function fail(res, message, statusCode = 500) {
  return res.status(statusCode).json({
    success: false,
    message,
  });
}

module.exports = { success, paginated, fail };
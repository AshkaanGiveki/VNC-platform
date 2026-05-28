/**
 * Pagination utility – parses query parameters and returns Mongoose helpers.
 * @module utils/pagination
 */

/**
 * Parse pagination parameters from request query.
 * @param {object} query – req.query object.
 * @param {object} [defaults] – default values { page, limit, sort, order }.
 * @returns {object} { page, limit, sort, order, skip }
 */
function parsePagination(query, defaults = {}) {
  let page = parseInt(query.page, 10) || defaults.page || 1;
  let limit = parseInt(query.limit, 10) || defaults.limit || 20;
  const sort = query.sort || defaults.sort || 'createdAt';
  const order = query.order && query.order.toLowerCase() === 'asc' ? 1 : -1;

  // Enforce limits
  if (page < 1) page = 1;
  if (limit < 1) limit = 1;
  if (limit > 100) limit = 100; // max per page

  const skip = (page - 1) * limit;

  return { page, limit, sort, order, skip };
}

/**
 * Apply pagination and sorting to a Mongoose query.
 * @param {mongoose.Query} query – Mongoose query.
 * @param {object} pagination – Result from parsePagination.
 * @returns {mongoose.Query} The modified query.
 */
function applyPagination(query, { skip, limit, sort, order }) {
  return query.skip(skip).limit(limit).sort({ [sort]: order });
}

/**
 * Build pagination metadata object.
 * @param {number} total – Total documents count.
 * @param {object} pagination – Result from parsePagination.
 * @returns {object} { page, limit, total, totalPages }
 */
function buildMeta(total, { page, limit }) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 0,
  };
}

module.exports = { parsePagination, applyPagination, buildMeta };
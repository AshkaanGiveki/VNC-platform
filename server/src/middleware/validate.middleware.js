const { ValidationError } = require('../utils/errors');

function validate(schema) {
  return (req, res, next) => {
    const errors = [];

    // Validate body
    if (schema.body) {
      const { error } = schema.body.validate(req.body, { abortEarly: false, allowUnknown: true });
      if (error) errors.push(...error.details.map((d) => d.message));
    }

    // Validate query
    if (schema.query) {
      const { error } = schema.query.validate(req.query, { abortEarly: false, allowUnknown: true });
      if (error) errors.push(...error.details.map((d) => d.message));
    }

    // Validate params
    if (schema.params) {
      const { error } = schema.params.validate(req.params, { abortEarly: false, allowUnknown: true });
      if (error) errors.push(...error.details.map((d) => d.message));
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    next();
  };
}

module.exports = validate;
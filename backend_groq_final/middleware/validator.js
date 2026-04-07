/**
 * middleware/validator.js
 * Input validation helpers for API routes
 */

function validateMineProfile(req, res, next) {
  const { mineType, annualProduction } = req.body;

  const errors = [];

  if (!mineType) {
    errors.push('mineType is required (opencast | underground | mixed)');
  } else if (!['opencast', 'underground', 'mixed'].includes(mineType)) {
    errors.push('mineType must be one of: opencast, underground, mixed');
  }

  if (!annualProduction) {
    errors.push('annualProduction is required (tonnes/year)');
  } else if (isNaN(parseFloat(annualProduction)) || parseFloat(annualProduction) <= 0) {
    errors.push('annualProduction must be a positive number');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }

  next();
}

function validateNumericFields(fields) {
  return (req, res, next) => {
    const errors = [];
    fields.forEach(field => {
      const val = req.body[field];
      if (val !== undefined && val !== '' && isNaN(parseFloat(val))) {
        errors.push(`${field} must be a valid number`);
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: errors });
    }
    next();
  };
}

function sanitizeBody(req, res, next) {
  // Trim string fields
  Object.keys(req.body).forEach(key => {
    if (typeof req.body[key] === 'string') {
      req.body[key] = req.body[key].trim();
    }
  });
  next();
}

module.exports = { validateMineProfile, validateNumericFields, sanitizeBody };

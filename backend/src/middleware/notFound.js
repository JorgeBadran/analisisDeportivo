'use strict';

function notFound(req, res) {
  res.status(404).json({
    status: 'error',
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
  });
}

module.exports = notFound;

function errorMiddleware(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.status || 500;

  console.error('Global error middleware caught error:', err);

  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    stack: err.stack
  });
}

module.exports = errorMiddleware;

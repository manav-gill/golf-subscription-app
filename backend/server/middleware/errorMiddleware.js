function errorMiddleware(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.status || 500;

  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error'
  });
}

module.exports = errorMiddleware;

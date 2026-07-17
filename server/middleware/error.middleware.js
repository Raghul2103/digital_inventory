// Centralized Error Handler Middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log for developer in non-production
  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  // Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new Error(message);
    error.statusCode = 404;
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const key = Object.keys(err.keyValue)[0];
    const message = `Duplicate field value entered: '${err.keyValue[key]}'. Please use another ${key}.`;
    error = new Error(message);
    error.statusCode = 400;
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new Error(message);
    error.statusCode = 400;
  }

  // Zod Validation Error (From Request Validators)
  if (err.name === 'ZodError' || err.issues) {
    const message = err.issues ? err.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ') : err.message;
    error = new Error(message);
    error.statusCode = 400;
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = new Error('Invalid authentication token');
    error.statusCode = 401;
  }
  if (err.name === 'TokenExpiredError') {
    error = new Error('Authentication token expired');
    error.statusCode = 401;
  }

  const statusCode = error.statusCode || err.statusCode || 500;
  const message = error.message || err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;

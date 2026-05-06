import { ApiError } from "../utils/ApiError.js";

const errorHandler = (err, _req, res, _next) => {
  const isApiError = err instanceof ApiError;

  const statusCode = isApiError ? err.statusCode : err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  const errors = isApiError ? err.errors : [];

  const response = {
    success: false,
    message,
    errors,
  };

  if (process.env.NODE_ENV !== "production") {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export { errorHandler };

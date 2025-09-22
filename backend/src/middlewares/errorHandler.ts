import type { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction): void => {
  logger.error("Error occurred:", {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // Default error response
  let statusCode = 500;
  let message = "Internal server error";

  // Handle specific error types
  if (error.name === "ValidationError") {
    statusCode = 400;
    message = error.message;
  } else if (error.name === "UnauthorizedError") {
    statusCode = 401;
    message = "Unauthorized access";
  } else if (error.name === "NotFoundError") {
    statusCode = 404;
    message = "Resource not found";
  } else if (error.message) {
    message = error.message;
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    },
    timestamp: new Date().toISOString(),
  });
};

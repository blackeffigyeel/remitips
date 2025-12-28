import type { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

// SQL injection protection middleware
export const sqlInjectionProtection = (req: Request, res: Response, next: NextFunction): void => {
  const suspiciousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /('|(\\')|(;)|(\\)|(\/\*)|(\\*\/)|(\\x))/gi,
    /((%27)|('))((%6F)|o|(%4F))((%72)|r|(%52))/gi,
    /((%27)|('))((%75)|u|(%55))((%6E)|n|(%4E))((%69)|i|(%49))((%6F)|o|(%4F))((%6E)|n|(%4E))/gi,
  ];

  const checkForSQLInjection = (value: string): boolean => {
    return suspiciousPatterns.some((pattern) => pattern.test(value));
  };

  const scanObject = (obj: any): boolean => {
    for (const key in obj) {
      if (typeof obj[key] === "string") {
        if (checkForSQLInjection(obj[key])) {
          return true;
        }
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        if (scanObject(obj[key])) {
          return true;
        }
      }
    }
    return false;
  };

  // Check query parameters
  if (req.query && scanObject(req.query)) {
    logger.warn("SQL injection attempt detected in query parameters", {
      ip: req.ip,
      url: req.url,
      query: req.query,
    });
    res.status(400).json({
      success: false,
      error: { message: "Invalid request parameters" },
    });
  }

  // Check request body
  if (req.body && scanObject(req.body)) {
    logger.warn("SQL injection attempt detected in request body", {
      ip: req.ip,
      url: req.url,
      body: req.body,
    });
    res.status(400).json({
      success: false,
      error: { message: "Invalid request data" },
    });
  }

  next();
};

import type { Request, Response, NextFunction } from "express";
import { query, validationResult } from "express-validator";

export const validateExchangeRateRequest = [
  query("senderCountry")
    .notEmpty()
    .withMessage("Sender country is required")
    .isLength({ min: 2, max: 3 })
    .withMessage("Sender country must be 2-3 characters")
    .matches(/^[A-Z]+$/i)
    .withMessage("Sender country must contain only letters"),

  query("recipientCountry")
    .notEmpty()
    .withMessage("Recipient country is required")
    .isLength({ min: 2, max: 3 })
    .withMessage("Recipient country must be 2-3 characters")
    .matches(/^[A-Z]+$/i)
    .withMessage("Recipient country must contain only letters"),

  query("amount")
    .notEmpty()
    .withMessage("Amount is required")
    .isFloat({ min: 1, max: 1000000 })
    .withMessage("Amount must be between 1 and 1,000,000"),

  query("fetchHistoricalData")
    .optional()
    .isBoolean()
    .withMessage("fetchHistoricalData must be a boolean"),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          message: "Validation failed",
          details: errors.array(),
        },
      });
    }
    next();
  },
];

export const validatePlatformRequest = [
  query("senderCountry")
    .notEmpty()
    .withMessage("Sender country is required")
    .isLength({ min: 2, max: 3 })
    .withMessage("Sender country must be 2-3 characters")
    .matches(/^[A-Z]+$/i)
    .withMessage("Sender country must contain only letters"),

  query("recipientCountry")
    .notEmpty()
    .withMessage("Recipient country is required")
    .isLength({ min: 2, max: 3 })
    .withMessage("Recipient country must be 2-3 characters")
    .matches(/^[A-Z]+$/i)
    .withMessage("Recipient country must contain only letters"),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          message: "Validation failed",
          details: errors.array(),
        },
      });
    }
    next();
  },
];

export const validateAnalyticsRequest = [
  query("senderCountry")
    .notEmpty()
    .withMessage("Sender country is required")
    .isLength({ min: 2, max: 3 })
    .withMessage("Sender country must be 2-3 characters")
    .matches(/^[A-Z]+$/i)
    .withMessage("Sender country must contain only letters"),

  query("recipientCountry")
    .notEmpty()
    .withMessage("Recipient country is required")
    .isLength({ min: 2, max: 3 })
    .withMessage("Recipient country must be 2-3 characters")
    .matches(/^[A-Z]+$/i)
    .withMessage("Recipient country must contain only letters"),

  query("days")
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage("Days must be between 1 and 365"),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          message: "Validation failed",
          details: errors.array(),
        },
      });
    }
    next();
  },
];

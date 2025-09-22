import type { Request, Response, NextFunction } from "express";
import { ExchangeRateService } from "../services/exchangeRateService";
import logger from "../utils/logger";

export const compareExchangeRates = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { senderCountry, recipientCountry, amount, fetchHistoricalData = false } = req.query;

    logger.info(
      `Exchange rate comparison request: ${senderCountry} -> ${recipientCountry}, Amount: ${amount}`,
    );

    const exchangeRateService = new ExchangeRateService();

    const result = await exchangeRateService.compareRates({
      senderCountry: senderCountry as string,
      recipientCountry: recipientCountry as string,
      amount: Number.parseFloat(amount as string),
      fetchHistoricalData: fetchHistoricalData === "true",
    });

    res.status(200).json({
      success: true,
      data: result,
      meta: {
        requestId: req.headers["x-request-id"] || "unknown",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        responseTime: `${result.responseTime}ms`,
      },
    });
  } catch (error) {
    logger.error("Error in compareExchangeRates:", error);
    next(error);
  }
};

export const healthCheck = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const exchangeRateService = new ExchangeRateService();
    const healthStatus = await exchangeRateService.healthCheck();

    const overallHealth = Object.values(healthStatus).every((status) => status === true);

    res.status(overallHealth ? 200 : 503).json({
      success: overallHealth,
      data: {
        status: overallHealth ? "healthy" : "degraded",
        platforms: healthStatus,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error in healthCheck:", error);
    next(error);
  }
};

export const getAvailablePlatforms = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { senderCountry, recipientCountry } = req.query;

    if (!senderCountry || !recipientCountry) {
      res.status(400).json({
        success: false,
        error: {
          message: "Both senderCountry and recipientCountry are required",
        },
      });
      return;
    }

    const exchangeRateService = new ExchangeRateService();
    const platforms = exchangeRateService.getAvailablePlatforms(
      senderCountry as string,
      recipientCountry as string,
    );

    res.status(200).json({
      success: true,
      data: {
        senderCountry,
        recipientCountry,
        availablePlatforms: platforms,
        count: platforms.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error in getAvailablePlatforms:", error);
    next(error);
  }
};

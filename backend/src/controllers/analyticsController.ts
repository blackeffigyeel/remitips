import type { Request, Response, NextFunction } from "express";
import { AnalyticsService } from "../services/analyticsService";
import { SchedulerService } from "../services/schedulerService";
import logger from "../utils/logger";

const analyticsService = new AnalyticsService();
const schedulerService = new SchedulerService();

export const getPlatformAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { senderCountry, recipientCountry, days = "30" } = req.query;

    if (!senderCountry || !recipientCountry) {
      res.status(400).json({
        success: false,
        error: { message: "Both senderCountry and recipientCountry are required" },
      });
      return;
    }

    const analytics = await analyticsService.getPlatformAnalytics(
      senderCountry as string,
      recipientCountry as string,
      Number.parseInt(days as string),
    );

    res.status(200).json({
      success: true,
      data: {
        corridor: `${senderCountry}-${recipientCountry}`,
        period: `${days} days`,
        platforms: analytics,
        summary: {
          totalPlatforms: analytics.length,
          bestPlatform: analytics[0]?.platform || null,
          averageWinRate: analytics.reduce((sum, p) => sum + p.winRate, 0) / analytics.length || 0,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error in getPlatformAnalytics:", error);
    next(error);
  }
};

export const getCorridorAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { days = "30" } = req.query;

    const analytics = await analyticsService.getCorridorAnalytics(Number.parseInt(days as string));

    res.status(200).json({
      success: true,
      data: {
        period: `${days} days`,
        corridors: analytics,
        summary: {
          totalCorridors: analytics.length,
          totalComparisons: analytics.reduce((sum, c) => sum + c.totalComparisons, 0),
          mostPopular: analytics[0] || null,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error in getCorridorAnalytics:", error);
    next(error);
  }
};

export const getTrendAnalysis = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { senderCountry, recipientCountry, periods } = req.query;

    if (!senderCountry || !recipientCountry) {
      res.status(400).json({
        success: false,
        error: { message: "Both senderCountry and recipientCountry are required" },
      });
      return;
    }

    const periodArray = periods ? (periods as string).split(",") : ["7d", "14d", "30d"];

    const trends = await analyticsService.getTrendAnalysis(
      senderCountry as string,
      recipientCountry as string,
      periodArray,
    );

    res.status(200).json({
      success: true,
      data: {
        corridor: `${senderCountry}-${recipientCountry}`,
        periods: periodArray,
        trends: trends,
        summary: {
          totalTrends: trends.length,
          improvingPlatforms: trends.filter((t) => t.direction === "improving").length,
          decliningPlatforms: trends.filter((t) => t.direction === "declining").length,
          stablePlatforms: trends.filter((t) => t.direction === "stable").length,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error in getTrendAnalysis:", error);
    next(error);
  }
};

export const getDailySummary = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();

    const summary = await analyticsService.generateDailySummary(targetDate);

    res.status(200).json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error in getDailySummary:", error);
    next(error);
  }
};

export const getSchedulerStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const status = schedulerService.getStatus();

    res.status(200).json({
      success: true,
      data: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error in getSchedulerStatus:", error);
    next(error);
  }
};

export const triggerManualJob = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { jobType } = req.params;

    let result: any = {};

    switch (jobType) {
      case "cleanup":
        await schedulerService.runDailyCleanup();
        result = { message: "Daily cleanup job triggered successfully" };
        break;

      case "summary":
        await schedulerService.generateDailySummary();
        result = { message: "Daily summary generation triggered successfully" };
        break;

      case "popularity":
        await schedulerService.updateCurrencyPairPopularity();
        result = { message: "Currency pair popularity update triggered successfully" };
        break;

      case "health":
        await schedulerService.performHealthCheck();
        result = { message: "Health check triggered successfully" };
        break;

      case "weekly":
        await schedulerService.generateWeeklyReport();
        result = { message: "Weekly report generation triggered successfully" };
        break;

      default:
        res.status(400).json({
          success: false,
          error: {
            message: "Invalid job type. Available: cleanup, summary, popularity, health, weekly",
          },
        });
        return;
    }

    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error in triggerManualJob:", error);
    next(error);
  }
};

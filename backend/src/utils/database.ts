import { prisma } from "../database/client";
import logger from "./logger";

// Utility functions for database operations
export class DatabaseUtils {
  // Log API usage for analytics
  static async logApiUsage(data: {
    endpoint: string;
    method: string;
    senderCountry?: string;
    recipientCountry?: string;
    amount?: number;
    fetchHistoricalData?: boolean;
    statusCode: number;
    responseTime: number;
    platformsQueried?: number;
    successfulPlatforms?: number;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      await prisma.apiUsageLog.create({
        data: {
          ...data,
          requestedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error("Failed to log API usage:", error);
    }
  }

  // Update platform performance metrics
  static async updatePlatformPerformance(data: {
    platformName: string;
    senderCountry: string;
    recipientCountry: string;
    success: boolean;
    responseTime: number;
    isWinner?: boolean;
    rank?: number;
  }) {
    try {
      // Use raw SQL to call the stored procedure
      await prisma.$executeRaw`
        SELECT update_platform_performance(
          ${data.platformName}::VARCHAR(50),
          ${data.senderCountry}::VARCHAR(3),
          ${data.recipientCountry}::VARCHAR(3),
          ${data.success}::BOOLEAN,
          ${data.responseTime}::INTEGER,
          ${data.isWinner || false}::BOOLEAN,
          ${data.rank || null}::INTEGER
        )
      `;
    } catch (error) {
      logger.error("Failed to update platform performance:", error);
    }
  }

  // Get historical data for leaderboard calculations
  static async getHistoricalData(senderCountry: string, recipientCountry: string, days: number) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      return await prisma.exchangeRateHistory.findMany({
        where: {
          senderCountry,
          recipientCountry,
          createdAt: {
            gte: startDate,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch (error) {
      logger.error("Failed to get historical data:", error);
      return [];
    }
  }

  // Check if exchange rate data exists for today
  static async hasDataForToday(senderCountry: string, recipientCountry: string): Promise<boolean> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const count = await prisma.exchangeRateHistory.count({
        where: {
          senderCountry,
          recipientCountry,
          createdAt: {
            gte: today,
          },
        },
      });

      return count > 0;
    } catch (error) {
      logger.error("Failed to check data for today:", error);
      return false;
    }
  }

  // Get platform leaderboard for a specific corridor and time period
  static async getPlatformLeaderboard(senderCountry: string, recipientCountry: string, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      return await prisma.platformPerformance.findMany({
        where: {
          senderCountry,
          recipientCountry,
          date: {
            gte: startDate,
          },
        },
        orderBy: [{ timesWinner: "desc" }, { averageRank: "asc" }],
      });
    } catch (error) {
      logger.error("Failed to get platform leaderboard:", error);
      return [];
    }
  }

  // Update currency pair popularity based on usage
  static async updateCurrencyPairPopularity() {
    try {
      await prisma.$executeRaw`SELECT update_currency_pair_popularity()`;
      logger.info("Currency pair popularity updated successfully");
    } catch (error) {
      logger.error("Failed to update currency pair popularity:", error);
    }
  }

  // Run daily maintenance tasks
  static async runDailyMaintenance() {
    try {
      // Run the daily summary generation
      await prisma.$executeRaw`SELECT generate_daily_summary()`;

      // Clean up expired records
      const deletedCount = await prisma.$executeRaw`SELECT cleanup_expired_records()`;

      logger.info("Daily maintenance completed successfully", { deletedCount });
    } catch (error) {
      logger.error("Daily maintenance failed:", error);
      throw error;
    }
  }
}

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
      // Get current date for the record
      const currentDate = new Date().toISOString().split('T')[0];

      // Use upsert to handle both new and existing records
      await prisma.platformPerformance.upsert({
        where: {
          platformName_senderCountry_recipientCountry_date: {
            platformName: data.platformName,
            senderCountry: data.senderCountry,
            recipientCountry: data.recipientCountry,
            date: new Date(currentDate),
          },
        },
        update: {
          totalRequests: { increment: 1 },
          successfulRequests: { increment: data.success ? 1 : 0 },
          failedRequests: { increment: data.success ? 0 : 1 },
          averageResponseTime: {
            // Calculate new average response time
            set: await this.calculateAverageResponseTime(
              data.platformName,
              data.senderCountry,
              data.recipientCountry,
              data.responseTime
            ),
          },
          timesWinner: { increment: data.isWinner ? 1 : 0 },
          averageRank: await this.calculateAverageRank(
            data.platformName,
            data.senderCountry,
            data.recipientCountry,
            data.rank
          ),
          updatedAt: new Date(),
        },
        create: {
          platformName: data.platformName,
          senderCountry: data.senderCountry,
          recipientCountry: data.recipientCountry,
          totalRequests: 1,
          successfulRequests: data.success ? 1 : 0,
          failedRequests: data.success ? 0 : 1,
          averageResponseTime: data.responseTime,
          timesWinner: data.isWinner ? 1 : 0,
          averageRank: data.rank || null,
          date: new Date(currentDate),
        },
      });
    } catch (error) {
      logger.error("Failed to update platform performance:", error);
      // Fallback to simple update without breaking the flow
      await this.fallbackPlatformUpdate(data);
    }
  }

  // Helper method to calculate average response time
  private static async calculateAverageResponseTime(
    platformName: string,
    senderCountry: string,
    recipientCountry: string,
    newResponseTime: number
  ): Promise<number> {
    try {
      const existing = await prisma.platformPerformance.findUnique({
        where: {
          platformName_senderCountry_recipientCountry_date: {
            platformName,
            senderCountry,
            recipientCountry,
            date: new Date(new Date().toISOString().split('T')[0]),
          },
        },
      });

      if (!existing || !existing.averageResponseTime) {
        return newResponseTime;
      }

      // Weighted average calculation
      const totalRequests = existing.totalRequests;
      return (existing.averageResponseTime * totalRequests + newResponseTime) / (totalRequests + 1);
    } catch (error) {
      return newResponseTime;
    }
  }

  // Helper method to calculate average rank
  private static async calculateAverageRank(
    platformName: string,
    senderCountry: string,
    recipientCountry: string,
    newRank?: number
  ): Promise<number | null> {
    if (!newRank) return null;

    try {
      const existing = await prisma.platformPerformance.findUnique({
        where: {
          platformName_senderCountry_recipientCountry_date: {
            platformName,
            senderCountry,
            recipientCountry,
            date: new Date(new Date().toISOString().split('T')[0]),
          },
        },
      });

      if (!existing || !existing.averageRank) {
        return newRank;
      }

      // Weighted average calculation
      const totalRequests = existing.totalRequests;
      return (existing.averageRank * totalRequests + newRank) / (totalRequests + 1);
    } catch (error) {
      return newRank;
    }
  }

  // Fallback method if the main update fails
  private static async fallbackPlatformUpdate(data: {
    platformName: string;
    senderCountry: string;
    recipientCountry: string;
    success: boolean;
    responseTime: number;
  }) {
    try {
      // Simple insert without complex calculations
      await prisma.platformPerformance.create({
        data: {
          platformName: data.platformName,
          senderCountry: data.senderCountry,
          recipientCountry: data.recipientCountry,
          totalRequests: 1,
          successfulRequests: data.success ? 1 : 0,
          failedRequests: data.success ? 0 : 1,
          averageResponseTime: data.responseTime,
          timesWinner: 0,
          averageRank: null,
          date: new Date(new Date().toISOString().split('T')[0]),
        },
      });
    } catch (error) {
      logger.error("Fallback platform update also failed:", error);
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

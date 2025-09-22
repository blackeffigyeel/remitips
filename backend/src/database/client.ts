import { PrismaClient, Prisma } from "@prisma/client";
import logger from "../utils/logger";

// Singleton pattern for Prisma client
class DatabaseClient {
  private static instance: PrismaClient;

  public static getInstance(): PrismaClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new PrismaClient({
        log: [
          { level: "query", emit: "event" } as Prisma.LogDefinition,
          { level: "error", emit: "event" } as Prisma.LogDefinition,
          { level: "info", emit: "event" } as Prisma.LogDefinition,
          { level: "warn", emit: "event" } as Prisma.LogDefinition,
        ],
        errorFormat: "pretty",
      });

      // Log database queries in development
      if (process.env.NODE_ENV === "development") {
        DatabaseClient.instance.$on("query" as never, (e: Prisma.QueryEvent) => {
          logger.debug("Database Query:", {
            query: e.query,
            params: e.params,
            duration: `${e.duration}ms`,
          });
        });
      }

      // Log database errors
      DatabaseClient.instance.$on("error" as never, (e: Prisma.LogEvent) => {
        logger.error("Database Error:", e);
      });

      // Log database info events
      DatabaseClient.instance.$on("info" as never, (e: Prisma.LogEvent) => {
        logger.info("Database Info:", e);
      });

      // Log database warnings
      DatabaseClient.instance.$on("warn" as never, (e: Prisma.LogEvent) => {
        logger.warn("Database Warning:", e);
      });

      // Handle graceful shutdown
      process.on("beforeExit", async () => {
        await DatabaseClient.instance.$disconnect();
        logger.info("Database connection closed");
      });
    }

    return DatabaseClient.instance;
  }

  // Method to test database connection
  public static async testConnection(): Promise<boolean> {
    try {
      const client = DatabaseClient.getInstance();
      await client.$queryRaw`SELECT 1`;
      logger.info("Database connection successful");
      return true;
    } catch (error) {
      logger.error("Database connection failed:", error);
      return false;
    }
  }

  // Method to run database cleanup
  public static async runCleanup(): Promise<number> {
    try {
      const client = DatabaseClient.getInstance();
      const result = await client.$queryRaw<[{ cleanup_expired_records: number }]>`
        SELECT cleanup_expired_records() as cleanup_expired_records
      `;
      const deletedCount = result[0].cleanup_expired_records;
      logger.info(`Database cleanup completed. Deleted ${deletedCount} expired records`);
      return deletedCount;
    } catch (error) {
      logger.error("Database cleanup failed:", error);
      throw error;
    }
  }

  // Method to get database statistics
  public static async getStats(): Promise<any> {
    try {
      const client = DatabaseClient.getInstance();

      const [totalExchangeRates, activeCurrencyPairs, platformPerformanceRecords, apiUsageLogs] =
        await Promise.all([
          client.exchangeRateHistory.count(),
          client.currencyPair.count({ where: { isActive: true } }),
          client.platformPerformance.count(),
          client.apiUsageLog.count({
            where: {
              requestedAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
              },
            },
          }),
        ]);

      return {
        totalExchangeRates,
        activeCurrencyPairs,
        platformPerformanceRecords,
        apiUsageLogsLast24h: apiUsageLogs,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("Failed to get database stats:", error);
      throw error;
    }
  }
}

export default DatabaseClient;
export const prisma = DatabaseClient.getInstance();

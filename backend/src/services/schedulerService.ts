import cron, { ScheduledTask } from "node-cron";
import { AnalyticsService } from "./analyticsService";
import { DatabaseUtils } from "../utils/database";
import DatabaseClient from "../database/client";
import logger from "../utils/logger";

export class SchedulerService {
  private analyticsService: AnalyticsService;
  private isRunning = false;
  private jobs: ScheduledTask[] = [];

  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  // Start all scheduled jobs
  start() {
    if (this.isRunning) {
      logger.warn("Scheduler service is already running");
      return;
    }

    logger.info("Starting scheduler service...");

    // Daily cleanup at 2 AM
    this.jobs.push(
      cron.schedule("0 2 * * *", async () => {
        await this.runDailyCleanup();
      }),
    );

    // Daily summary generation at 1 AM
    this.jobs.push(
      cron.schedule("0 1 * * *", async () => {
        await this.generateDailySummary();
      }),
    );

    // Update currency pair popularity every 6 hours
    this.jobs.push(
      cron.schedule("0 */6 * * *", async () => {
        await this.updateCurrencyPairPopularity();
      }),
    );

    // Database health check every hour
    this.jobs.push(
      cron.schedule("0 * * * *", async () => {
        await this.performHealthCheck();
      }),
    );

    // Weekly analytics report on Sundays at 3 AM
    this.jobs.push(
      cron.schedule("0 3 * * 0", async () => {
        await this.generateWeeklyReport();
      }),
    );

    this.isRunning = true;
    logger.info("Scheduler service started successfully");
  }

  // Stop all scheduled jobs
  stop() {
    if (!this.isRunning) {
      logger.warn("Scheduler service is not running");
      return;
    }

    // Destroy all scheduled jobs
    this.jobs.forEach((job) => job.destroy());
    this.jobs = [];

    this.isRunning = false;
    logger.info("Scheduler service stopped");
  }

  // Manual trigger methods for testing
  async runDailyCleanup() {
    try {
      logger.info("Starting daily cleanup job...");

      // Clean up expired records
      const deletedCount = await DatabaseClient.runCleanup();

      // Run database maintenance
      await DatabaseUtils.runDailyMaintenance();

      logger.info(`Daily cleanup completed. Deleted ${deletedCount} expired records`);
    } catch (error) {
      logger.error("Daily cleanup job failed:", error);
    }
  }

  async generateDailySummary() {
    try {
      logger.info("Generating daily summary...");

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const summary = await this.analyticsService.generateDailySummary(yesterday);

      // Log the summary (in production, you might send this to a monitoring service)
      logger.info("Daily summary generated:", summary);

      // Store summary in database for historical tracking
      await this.storeDailySummary(summary);
    } catch (error) {
      logger.error("Daily summary generation failed:", error);
    }
  }

  async updateCurrencyPairPopularity() {
    try {
      logger.info("Updating currency pair popularity...");

      await DatabaseUtils.updateCurrencyPairPopularity();

      logger.info("Currency pair popularity updated successfully");
    } catch (error) {
      logger.error("Currency pair popularity update failed:", error);
    }
  }

  async performHealthCheck() {
    try {
      logger.debug("Performing database health check...");

      const isHealthy = await DatabaseClient.testConnection();
      const stats = await DatabaseClient.getStats();

      if (!isHealthy) {
        logger.error("Database health check failed");
        // In production, you might send alerts here
      } else {
        logger.debug("Database health check passed", stats);
      }
    } catch (error) {
      logger.error("Health check failed:", error);
    }
  }

  async generateWeeklyReport() {
    try {
      logger.info("Generating weekly analytics report...");

      // Get top corridors for the week
      const corridorAnalytics = await this.analyticsService.getCorridorAnalytics(7);

      // Get platform performance for popular corridors
      const reports = [];
      for (const corridor of corridorAnalytics.slice(0, 5)) {
        const platformAnalytics = await this.analyticsService.getPlatformAnalytics(
          corridor.senderCountry,
          corridor.recipientCountry,
          7,
        );

        const trendAnalysis = await this.analyticsService.getTrendAnalysis(
          corridor.senderCountry,
          corridor.recipientCountry,
          ["7d"],
        );

        reports.push({
          corridor: `${corridor.senderCountry}-${corridor.recipientCountry}`,
          analytics: platformAnalytics,
          trends: trendAnalysis,
        });
      }

      logger.info("Weekly report generated", {
        corridorsAnalyzed: reports.length,
        totalCorridors: corridorAnalytics.length,
      });

      // Store weekly report
      await this.storeWeeklyReport(reports);
    } catch (error) {
      logger.error("Weekly report generation failed:", error);
    }
  }

  // Helper methods to store reports
  private async storeDailySummary(summary: any) {
    try {
      // In a production system, you might store this in a separate reports table
      // For now, we'll just log it
      logger.info("Daily summary stored", {
        date: summary.date,
        comparisons: summary.totalComparisons,
      });
    } catch (error) {
      logger.error("Failed to store daily summary:", error);
    }
  }

  private async storeWeeklyReport(reports: any[]) {
    try {
      // In a production system, you might store this in a separate reports table
      // For now, we'll just log it
      logger.info("Weekly report stored", {
        corridorsAnalyzed: reports.length,
      });
    } catch (error) {
      logger.error("Failed to store weekly report:", error);
    }
  }

  // Get scheduler status
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextJobs: this.isRunning ? this.getNextJobTimes() : [],
      activeJobs: this.jobs.length,
    };
  }

  // Pause all jobs temporarily
  pause() {
    if (!this.isRunning) {
      logger.warn("Scheduler service is not running");
      return;
    }

    this.jobs.forEach((job) => job.stop());
    logger.info("Scheduler service paused");
  }

  // Resume all paused jobs
  resume() {
    if (!this.isRunning) {
      logger.warn("Scheduler service is not running");
      return;
    }

    this.jobs.forEach((job) => job.start());
    logger.info("Scheduler service resumed");
  }

  private getNextJobTimes() {
    // This would return the next execution times for each job
    // Implementation depends on the cron library's capabilities
    return [
      { job: "Daily Cleanup", next: "2:00 AM" },
      { job: "Daily Summary", next: "1:00 AM" },
      { job: "Currency Popularity Update", next: "Every 6 hours" },
      { job: "Health Check", next: "Every hour" },
      { job: "Weekly Report", next: "Sunday 3:00 AM" },
    ];
  }
}

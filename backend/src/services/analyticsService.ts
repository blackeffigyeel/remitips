import { prisma } from "../database/client";
import { DatabaseUtils } from "../utils/database";
import logger from "../utils/logger";
import type { ExchangeRateResult } from "../integrations";

interface PlatformAnalytics {
  platform: string;
  totalComparisons: number;
  winCount: number;
  winRate: number;
  averageReceiveAmount: number;
  averageExchangeRate: number;
  averageFees: number;
  averageResponseTime: number;
  reliabilityScore: number;
  trendDirection: "improving" | "declining" | "stable";
  lastSeen: Date;
}

interface CorridorAnalytics {
  senderCountry: string;
  recipientCountry: string;
  totalComparisons: number;
  averageAmount: number;
  popularityRank: number;
  bestPlatform: string;
  averageSavings: number;
  volatilityScore: number;
  lastCompared: Date;
}

interface TrendAnalysis {
  platform: string;
  period: string;
  startRate: number;
  endRate: number;
  changePercentage: number;
  direction: "improving" | "declining" | "stable";
  confidence: number;
}

export class AnalyticsService {
  // Generate comprehensive platform analytics for a specific corridor
  async getPlatformAnalytics(
    senderCountry: string,
    recipientCountry: string,
    days = 30,
  ): Promise<PlatformAnalytics[]> {
    try {
      const historicalData = await DatabaseUtils.getHistoricalData(
        senderCountry,
        recipientCountry,
        days,
      );

      if (historicalData.length === 0) {
        return [];
      }

      const platformStats: { [platform: string]: any } = {};

      // Process historical data
      historicalData.forEach((record) => {
        try {
          const platforms = parsePlatformData(record.platformData);

          platforms.forEach((platform) => {
            if (!platformStats[platform.platform]) {
              platformStats[platform.platform] = {
                platform: platform.platform,
                comparisons: [],
                wins: 0,
                receiveAmounts: [],
                exchangeRates: [],
                fees: [],
                responseTimes: [],
                lastSeen: record.createdAt,
              };
            }

            const stats = platformStats[platform.platform];
            stats.comparisons.push(record);
            stats.receiveAmounts.push(platform.receiveAmount);
            stats.exchangeRates.push(platform.exchangeRate);
            stats.fees.push(platform.fees);

            if (platform.responseTime) {
              stats.responseTimes.push(platform.responseTime);
            }

            if (record.winnerPlatform === platform.platform) {
              stats.wins++;
            }

            if (record.createdAt > stats.lastSeen) {
              stats.lastSeen = record.createdAt;
            }
          });
        } catch (error) {
          logger.warn("Failed to parse platform data for analytics", { recordId: record.id });
        }
      });

      // Calculate analytics for each platform
      const analytics: PlatformAnalytics[] = Object.values(platformStats).map((stats: any) => {
        const totalComparisons = stats.comparisons.length;
        const winRate = (stats.wins / totalComparisons) * 100;
        const averageReceiveAmount =
          stats.receiveAmounts.reduce((a: number, b: number) => a + b, 0) /
          stats.receiveAmounts.length;
        const averageExchangeRate =
          stats.exchangeRates.reduce((a: number, b: number) => a + b, 0) /
          stats.exchangeRates.length;
        const averageFees =
          stats.fees.reduce((a: number, b: number) => a + b, 0) / stats.fees.length;
        const averageResponseTime =
          stats.responseTimes.length > 0
            ? stats.responseTimes.reduce((a: number, b: number) => a + b, 0) /
              stats.responseTimes.length
            : 0;

        // Calculate reliability score (combination of win rate, response time, and consistency)
        const responseTimeScore = Math.max(0, 100 - averageResponseTime / 100); // Lower response time = higher score
        const consistencyScore = this.calculateConsistencyScore(stats.receiveAmounts);
        const reliabilityScore = winRate * 0.5 + responseTimeScore * 0.3 + consistencyScore * 0.2;

        // Calculate trend direction
        const trendDirection = this.calculateTrendDirection(stats.receiveAmounts);

        return {
          platform: stats.platform,
          totalComparisons,
          winCount: stats.wins,
          winRate,
          averageReceiveAmount,
          averageExchangeRate,
          averageFees,
          averageResponseTime,
          reliabilityScore,
          trendDirection,
          lastSeen: stats.lastSeen,
        };
      });

      // Sort by reliability score
      return analytics.sort((a, b) => b.reliabilityScore - a.reliabilityScore);
    } catch (error) {
      logger.error("Error generating platform analytics:", error);
      return [];
    }
  }

  // Generate corridor analytics across all platforms
  async getCorridorAnalytics(days = 30): Promise<CorridorAnalytics[]> {
    try {
      const corridors = await prisma.exchangeRateHistory.groupBy({
        by: ["senderCountry", "recipientCountry"],
        where: {
          createdAt: {
            gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
          },
        },
        _count: {
          id: true,
        },
        _avg: {
          amount: true,
        },
        _max: {
          createdAt: true,
        },
      });

      const analytics: CorridorAnalytics[] = [];

      for (const corridor of corridors) {
        const historicalData = await DatabaseUtils.getHistoricalData(
          corridor.senderCountry,
          corridor.recipientCountry,
          days,
        );

        // Find the most frequent winner
        const winnerCounts: { [platform: string]: number } = {};
        let totalSavings = 0;
        const receiveAmounts: number[] = [];

        historicalData.forEach((record) => {
          if (record.winnerPlatform) {
            winnerCounts[record.winnerPlatform] = (winnerCounts[record.winnerPlatform] || 0) + 1;
          }

          if (record.bestReceiveAmount && record.officialAmount) {
            const savings = record.bestReceiveAmount - record.officialAmount;
            totalSavings += savings;
            receiveAmounts.push(record.bestReceiveAmount);
          }
        });

        const bestPlatform = Object.entries(winnerCounts).reduce(
          (a, b) => (b[1] > a[1] ? b : a),
          ["", 0],
        )[0];
        const averageSavings = historicalData.length > 0 ? totalSavings / historicalData.length : 0;
        const volatilityScore = this.calculateVolatilityScore(receiveAmounts);

        analytics.push({
          senderCountry: corridor.senderCountry,
          recipientCountry: corridor.recipientCountry,
          totalComparisons: corridor._count.id,
          averageAmount: corridor._avg.amount || 0,
          popularityRank: 0, // Will be set after sorting
          bestPlatform,
          averageSavings,
          volatilityScore,
          lastCompared: corridor._max.createdAt || new Date(),
        });
      }

      // Sort by total comparisons and assign popularity ranks
      analytics.sort((a, b) => b.totalComparisons - a.totalComparisons);
      analytics.forEach((corridor, index) => {
        corridor.popularityRank = index + 1;
      });

      return analytics;
    } catch (error) {
      logger.error("Error generating corridor analytics:", error);
      return [];
    }
  }

  // Generate trend analysis for platforms
  async getTrendAnalysis(
    senderCountry: string,
    recipientCountry: string,
    periods = ["7d", "14d", "30d"],
  ): Promise<TrendAnalysis[]> {
    try {
      const trends: TrendAnalysis[] = [];

      for (const period of periods) {
        const days = this.parsePeriodToDays(period);
        const data = await DatabaseUtils.getHistoricalData(senderCountry, recipientCountry, days);

        if (data.length < 2) continue;

        // Group by platform and calculate trends
        const platformData: { [platform: string]: { rates: number[]; dates: Date[] } } = {};

        data.forEach((record) => {
          try {
            const platforms = parsePlatformData(record.platformData);
            platforms.forEach((platform) => {
              if (!platformData[platform.platform]) {
                platformData[platform.platform] = { rates: [], dates: [] };
              }
              platformData[platform.platform].rates.push(platform.receiveAmount);
              platformData[platform.platform].dates.push(record.createdAt);
            });
          } catch (error) {
            logger.warn("Failed to parse platform data for trend analysis");
          }
        });

        // Calculate trends for each platform
        Object.entries(platformData).forEach(([platform, data]) => {
          if (data.rates.length < 2) return;

          const sortedData = data.rates
            .map((rate, index) => ({ rate, date: data.dates[index] }))
            .sort((a, b) => a.date.getTime() - b.date.getTime());

          const startRate = sortedData[0].rate;
          const endRate = sortedData[sortedData.length - 1].rate;
          const changePercentage = ((endRate - startRate) / startRate) * 100;

          let direction: "improving" | "declining" | "stable" = "stable";
          if (Math.abs(changePercentage) > 2) {
            direction = changePercentage > 0 ? "improving" : "declining";
          }

          // Calculate confidence based on data consistency
          const confidence = this.calculateTrendConfidence(sortedData.map((d) => d.rate));

          trends.push({
            platform,
            period,
            startRate,
            endRate,
            changePercentage,
            direction,
            confidence,
          });
        });
      }

      return trends.sort((a, b) => Math.abs(b.changePercentage) - Math.abs(a.changePercentage));
    } catch (error) {
      logger.error("Error generating trend analysis:", error);
      return [];
    }
  }

  // Generate daily summary report
  async generateDailySummary(date: Date = new Date()): Promise<any> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const dailyData = await prisma.exchangeRateHistory.findMany({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      if (dailyData.length === 0) {
        return {
          date: date.toISOString().split("T")[0],
          totalComparisons: 0,
          uniqueCorridors: 0,
          platformPerformance: {},
          topCorridors: [],
          summary: "No data available for this date",
        };
      }

      // Calculate daily metrics
      const uniqueCorridors = new Set(
        dailyData.map((d) => `${d.senderCountry}-${d.recipientCountry}`),
      ).size;
      const platformWins: { [platform: string]: number } = {};
      const corridorCounts: { [corridor: string]: number } = {};

      dailyData.forEach((record) => {
        const corridor = `${record.senderCountry}-${record.recipientCountry}`;
        corridorCounts[corridor] = (corridorCounts[corridor] || 0) + 1;

        if (record.winnerPlatform) {
          platformWins[record.winnerPlatform] = (platformWins[record.winnerPlatform] || 0) + 1;
        }
      });

      const topCorridors = Object.entries(corridorCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([corridor, count]) => ({ corridor, comparisons: count }));

      return {
        date: date.toISOString().split("T")[0],
        totalComparisons: dailyData.length,
        uniqueCorridors,
        platformPerformance: platformWins,
        topCorridors,
        averageAmount: dailyData.reduce((sum, d) => sum + d.amount, 0) / dailyData.length,
        summary: `Processed ${dailyData.length} comparisons across ${uniqueCorridors} corridors`,
      };
    } catch (error) {
      logger.error("Error generating daily summary:", error);
      throw error;
    }
  }

  // Helper methods
  private calculateConsistencyScore(values: number[]): number {
    if (values.length < 2) return 100;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = (standardDeviation / mean) * 100;

    // Lower coefficient of variation = higher consistency score
    return Math.max(0, 100 - coefficientOfVariation);
  }

  private calculateTrendDirection(values: number[]): "improving" | "declining" | "stable" {
    if (values.length < 3) return "stable";

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const changePercentage = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (Math.abs(changePercentage) < 2) return "stable";
    return changePercentage > 0 ? "improving" : "declining";
  }

  private calculateVolatilityScore(values: number[]): number {
    if (values.length < 2) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;

    return Math.sqrt(variance);
  }

  private calculateTrendConfidence(values: number[]): number {
    if (values.length < 3) return 0;

    // Simple linear regression to calculate R-squared
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const yMean = sumY / n;
    const totalSumSquares = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const residualSumSquares = y.reduce((sum, yi, i) => {
      const predicted = slope * x[i] + intercept;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);

    const rSquared = 1 - residualSumSquares / totalSumSquares;
    return Math.max(0, Math.min(100, rSquared * 100));
  }

  private parsePeriodToDays(period: string): number {
    const match = period.match(/(\d+)([dw])/);
    if (!match) return 30;

    const value = Number.parseInt(match[1]);
    const unit = match[2];

    return unit === "w" ? value * 7 : value;
  }
}

function parsePlatformData(data: unknown): ExchangeRateResult[] {
  if (!data) return [];
  if (typeof data === "string") return JSON.parse(data);
  if (Array.isArray(data)) return data as ExchangeRateResult[];
  return [];
}

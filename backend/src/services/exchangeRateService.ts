import axios from "axios";
import logger from "../utils/logger";
import { prisma } from "../database/client";
import { IntegrationManager } from "../utils/integrationManager";
import { DatabaseUtils } from "../utils/database";
import type { ExchangeRateResult } from "../integrations";

interface CompareRatesRequest {
  senderCountry: string;
  recipientCountry: string;
  amount: number;
  fetchHistoricalData: boolean;
}

interface OfficialExchangeRate {
  baseCurrency: string;
  targetCurrency: string;
  conversionRate: number;
  convertedAmount: number;
  lastUpdate: string;
}

interface HistoricalDataPeriod {
  averageRates: { [platform: string]: number };
  bestPerformers: { platform: string; winCount: number; avgReceiveAmount: number }[];
  trends: {
    improving: string[];
    declining: string[];
    stable: string[];
  };
  totalComparisons: number;
  periodDays: number;
}

export class ExchangeRateService {
  private integrationManager: IntegrationManager;

  constructor() {
    this.integrationManager = new IntegrationManager();
  }

  async compareRates(request: CompareRatesRequest) {
    const startTime = Date.now();

    try {
      logger.info("Starting exchange rate comparison", {
        senderCountry: request.senderCountry,
        recipientCountry: request.recipientCountry,
        amount: request.amount,
        fetchHistoricalData: request.fetchHistoricalData,
      });

      const officialRate = await this.getOfficialExchangeRate(
        request.senderCountry,
        request.recipientCountry,
        request.amount,
      );

      const platformRates = await this.integrationManager.getAllRates({
        senderCountry: request.senderCountry,
        recipientCountry: request.recipientCountry,
        amount: request.amount,
        fetchHistoricalData: request.fetchHistoricalData,
      });

      const winner = this.findBestRate(platformRates);

      const metrics = this.calculateMetrics(platformRates, officialRate);

      const response = {
        senderCountry: request.senderCountry,
        sendingAmount: request.amount,
        sendingCurrencyCode: this.getCurrencyCode(request.senderCountry),
        recipientCountry: request.recipientCountry,
        recipientCurrencyCode: this.getCurrencyCode(request.recipientCountry),
        officialExchangeRate: officialRate,
        platforms: platformRates,
        winner: winner,
        metrics: metrics,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        ...(request.fetchHistoricalData && {
          historicalData: await this.getHistoricalData(request),
        }),
      };

      await this.saveExchangeRateData(request, response);

      await DatabaseUtils.logApiUsage({
        endpoint: "/api/v1/exchange-rates/compare",
        method: "GET",
        senderCountry: request.senderCountry,
        recipientCountry: request.recipientCountry,
        amount: request.amount,
        fetchHistoricalData: request.fetchHistoricalData,
        statusCode: 200,
        responseTime: Date.now() - startTime,
        platformsQueried: platformRates.length,
        successfulPlatforms: platformRates.filter((p) => p.success).length,
      });

      return response;
    } catch (error) {
      logger.error("Error in compareRates:", error);

      await DatabaseUtils.logApiUsage({
        endpoint: "/api/v1/exchange-rates/compare",
        method: "GET",
        senderCountry: request.senderCountry,
        recipientCountry: request.recipientCountry,
        amount: request.amount,
        fetchHistoricalData: request.fetchHistoricalData,
        statusCode: 500,
        responseTime: Date.now() - startTime,
        platformsQueried: 0,
        successfulPlatforms: 0,
      });

      throw new Error("Failed to compare exchange rates");
    }
  }

  private async getOfficialExchangeRate(
    senderCountry: string,
    recipientCountry: string,
    amount: number,
  ): Promise<OfficialExchangeRate> {
    try {
      const fromCurrency = this.getCurrencyCode(senderCountry);
      const toCurrency = this.getCurrencyCode(recipientCountry);

      logger.info("Fetching official exchange rate", {
        fromCurrency,
        toCurrency,
        amount,
      });

      const response = await axios.get(
        `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_RATE_API_KEY}/pair/${fromCurrency}/${toCurrency}/${amount}`,
        {
          timeout: 5000, // 5 second timeout
        },
      );

      if (response.data.result !== "success") {
        throw new Error(`Exchange rate API error: ${response.data["error-type"]}`);
      }

      return {
        baseCurrency: response.data.base_code,
        targetCurrency: response.data.target_code,
        conversionRate: response.data.conversion_rate,
        convertedAmount: response.data.conversion_result,
        lastUpdate: response.data.time_last_update_utc,
      };
    } catch (error) {
      logger.error("Error fetching official exchange rate:", error);
      throw new Error("Failed to fetch official exchange rate");
    }
  }

  private findBestRate(rates: ExchangeRateResult[]): ExchangeRateResult | null {
    if (rates.length === 0) return null;

    const successfulRates = rates.filter((rate) => rate.success);
    if (successfulRates.length === 0) return null;

    // Primary: highest receive amount
    // Secondary: lowest total cost
    // Tertiary: lowest fees
    return successfulRates.reduce((best, current) => {
      if (current.receiveAmount > best.receiveAmount) return current;
      if (current.receiveAmount === best.receiveAmount) {
        if (current.totalCost < best.totalCost) return current;
        if (current.totalCost === best.totalCost && current.fees < best.fees) return current;
      }
      return best;
    });
  }

  private calculateMetrics(rates: ExchangeRateResult[], officialRate: OfficialExchangeRate) {
    const successfulRates = rates.filter((rate) => rate.success);

    if (successfulRates.length === 0) {
      return {
        averageReceiveAmount: 0,
        averageExchangeRate: 0,
        averageFees: 0,
        bestReceiveAmount: 0,
        worstReceiveAmount: 0,
        spreadPercentage: 0,
        officialRateComparison: 0,
      };
    }

    const receiveAmounts = successfulRates.map((r) => r.receiveAmount);
    const exchangeRates = successfulRates.map((r) => r.exchangeRate);
    const fees = successfulRates.map((r) => r.fees);

    const averageReceiveAmount = receiveAmounts.reduce((a, b) => a + b, 0) / receiveAmounts.length;
    const averageExchangeRate = exchangeRates.reduce((a, b) => a + b, 0) / exchangeRates.length;
    const averageFees = fees.reduce((a, b) => a + b, 0) / fees.length;

    const bestReceiveAmount = Math.max(...receiveAmounts);
    const worstReceiveAmount = Math.min(...receiveAmounts);
    const spreadPercentage = ((bestReceiveAmount - worstReceiveAmount) / bestReceiveAmount) * 100;

    // Compare average platform rate to official rate
    const officialRateComparison =
      ((averageExchangeRate - officialRate.conversionRate) / officialRate.conversionRate) * 100;

    return {
      averageReceiveAmount,
      averageExchangeRate,
      averageFees,
      bestReceiveAmount,
      worstReceiveAmount,
      spreadPercentage,
      officialRateComparison,
      platformCount: successfulRates.length,
    };
  }

  private async getHistoricalData(request: CompareRatesRequest) {
    const periods = [1, 7, 14, 30]; // days
    const historicalData: { [key: string]: HistoricalDataPeriod } = {};

    for (const days of periods) {
      const data = await DatabaseUtils.getHistoricalData(
        request.senderCountry,
        request.recipientCountry,
        days,
      );

      historicalData[`last${days}Days`] = await this.processHistoricalData(data, days);
    }

    const leaderboard = await DatabaseUtils.getPlatformLeaderboard(
      request.senderCountry,
      request.recipientCountry,
      30,
    );

    return {
      periods: historicalData,
      leaderboard: leaderboard,
      summary: {
        totalHistoricalRecords: await this.getTotalHistoricalRecords(
          request.senderCountry,
          request.recipientCountry,
        ),
        oldestRecord: await this.getOldestRecord(request.senderCountry, request.recipientCountry),
        mostRecentRecord: await this.getMostRecentRecord(
          request.senderCountry,
          request.recipientCountry,
        ),
      },
    };
  }

  private async processHistoricalData(data: any[], days: number): Promise<HistoricalDataPeriod> {
    if (data.length === 0) {
      return {
        averageRates: {},
        bestPerformers: [],
        trends: { improving: [], declining: [], stable: [] },
        totalComparisons: 0,
        periodDays: days,
      };
    }

    // Parse platform data and calculate averages
    const platformStats: {
      [platform: string]: { rates: number[]; winCount: number; receiveAmounts: number[] };
    } = {};

    data.forEach((record) => {
      try {
        const platforms = record.platformData as ExchangeRateResult[];
        platforms.forEach((platform) => {
          if (!platformStats[platform.platform]) {
            platformStats[platform.platform] = { rates: [], winCount: 0, receiveAmounts: [] };
          }
          platformStats[platform.platform].rates.push(platform.exchangeRate);
          platformStats[platform.platform].receiveAmounts.push(platform.receiveAmount);

          if (record.winnerPlatform === platform.platform) {
            platformStats[platform.platform].winCount++;
          }
        });
      } catch (error) {
        logger.warn("Failed to parse platform data for historical record", { recordId: record.id });
      }
    });

    // Calculate averages
    const averageRates: { [platform: string]: number } = {};
    const bestPerformers: { platform: string; winCount: number; avgReceiveAmount: number }[] = [];

    Object.entries(platformStats).forEach(([platform, stats]) => {
      averageRates[platform] = stats.rates.reduce((a, b) => a + b, 0) / stats.rates.length;
      bestPerformers.push({
        platform,
        winCount: stats.winCount,
        avgReceiveAmount:
          stats.receiveAmounts.reduce((a, b) => a + b, 0) / stats.receiveAmounts.length,
      });
    });

    // Sort best performers by win count, then by average receive amount
    bestPerformers.sort((a, b) => {
      if (b.winCount !== a.winCount) return b.winCount - a.winCount;
      return b.avgReceiveAmount - a.avgReceiveAmount;
    });

    // Calculate trends (simplified - would need more sophisticated analysis in production)
    const trends = {
      improving: bestPerformers.slice(0, 2).map((p) => p.platform),
      declining: bestPerformers.slice(-2).map((p) => p.platform),
      stable: bestPerformers.slice(2, -2).map((p) => p.platform),
    };

    return {
      averageRates,
      bestPerformers,
      trends,
      totalComparisons: data.length,
      periodDays: days,
    };
  }

  private async saveExchangeRateData(request: CompareRatesRequest, response: any) {
    try {
      // Check if we already have data for today
      const hasDataToday = await DatabaseUtils.hasDataForToday(
        request.senderCountry,
        request.recipientCountry,
      );

      if (!hasDataToday) {
        const winner = response.winner;
        const metrics = response.metrics;

        // Explicit destructure to ensure correct types
        const {
          averageExchangeRate,
          spreadPercentage,
          platformCount,
        } = metrics;

        await prisma.exchangeRateHistory.create({
          data: {
            senderCountry: request.senderCountry,
            recipientCountry: request.recipientCountry,
            senderCurrency: response.sendingCurrencyCode,
            recipientCurrency: response.recipientCurrencyCode,
            amount: request.amount,
            officialRate: response.officialExchangeRate.conversionRate,
            officialAmount: response.officialExchangeRate.convertedAmount,
            platformData: response.platforms,
            winnerPlatform: winner?.platform || null,
            bestReceiveAmount: winner?.receiveAmount || null,
            bestExchangeRate: winner?.exchangeRate || null,
            averageRate: averageExchangeRate,
            rateVariance: spreadPercentage,
            platformCount: platformCount,
            expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days later
          },
        });

        logger.info("Saved exchange rate data to database", {
          senderCountry: request.senderCountry,
          recipientCountry: request.recipientCountry,
          winnerPlatform: winner?.platform,
          platformCount: metrics.platformCount,
        });
      }
    } catch (error) {
      logger.error("Error saving exchange rate data:", error);
    }
  }

  private async getTotalHistoricalRecords(
    senderCountry: string,
    recipientCountry: string,
  ): Promise<number> {
    return await prisma.exchangeRateHistory.count({
      where: { senderCountry, recipientCountry },
    });
  }

  private async getOldestRecord(senderCountry: string, recipientCountry: string) {
    const record = await prisma.exchangeRateHistory.findFirst({
      where: { senderCountry, recipientCountry },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });
    return record?.createdAt || null;
  }

  private async getMostRecentRecord(senderCountry: string, recipientCountry: string) {
    const record = await prisma.exchangeRateHistory.findFirst({
      where: { senderCountry, recipientCountry },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    return record?.createdAt || null;
  }

  private getCurrencyCode(country: string): string {
    const currencyMap: { [key: string]: string } = {
      US: "USD",
      USA: "USD",
      NG: "NGN",
      NGA: "NGN",
      GB: "GBP",
      UK: "GBP",
      CA: "CAD",
      MX: "MXN",
      PH: "PHP",
      IN: "INR",
      KE: "KES",
      GH: "GHS",
      ZA: "ZAR",
      EU: "EUR",
      DE: "EUR",
      FR: "EUR",
      IT: "EUR",
      ES: "EUR",
      AU: "AUD",
      NZ: "NZD",
      JP: "JPY",
      CN: "CNY",
      BR: "BRL",
      AR: "ARS",
      CL: "CLP",
      CO: "COP",
      PE: "PEN",
      TH: "THB",
      VN: "VND",
      ID: "IDR",
      MY: "MYR",
      SG: "SGD",
      KR: "KRW",
      AE: "AED",
      SA: "SAR",
      EG: "EGP",
      MA: "MAD",
      TN: "TND",
      DZ: "DZD",
      UY: "UYU",
    };

    return currencyMap[country.toUpperCase()] || "USD";
  }

  async healthCheck() {
    return await this.integrationManager.healthCheck();
  }

  getAvailablePlatforms(senderCountry: string, recipientCountry: string) {
    return this.integrationManager.getAvailablePlatforms(senderCountry, recipientCountry);
  }
}

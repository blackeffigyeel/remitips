import {
  WiseIntegration,
  RemitlyIntegration,
  MoneyGramIntegration,
  WorldRemitIntegration,
  AirwallexIntegration,
  RevolutIntegration,
  XEIntegration,
  RiaIntegration,
  XoomIntegration,
  type BaseIntegration,
  type ExchangeRateRequest,
  type ExchangeRateResult,
} from "../integrations";
import { DatabaseUtils } from "./database";
import logger from "./logger";

export class IntegrationManager {
  private integrations: BaseIntegration[];

  constructor() {
    this.integrations = [
      new WiseIntegration(),
      new RemitlyIntegration(),
      new MoneyGramIntegration(),
      new WorldRemitIntegration(),
      new AirwallexIntegration(),
      new RevolutIntegration(),
      new XEIntegration(),
      new RiaIntegration(),
      new XoomIntegration(),
    ];
  }

  // Get exchange rates from all platforms
  async getAllRates(request: ExchangeRateRequest): Promise<ExchangeRateResult[]> {
    const startTime = Date.now();

    logger.info("Starting exchange rate comparison", {
      senderCountry: request.senderCountry,
      recipientCountry: request.recipientCountry,
      amount: request.amount,
      platformCount: this.integrations.length,
    });

    // Execute all integrations in parallel
    const results = await Promise.allSettled(
      this.integrations.map(async (integration) => {
        const platformStartTime = Date.now();

        try {
          const result = await integration.getExchangeRate(request);
          const responseTime = Date.now() - platformStartTime;

          if (result) {
            result.responseTime = responseTime;

            // Log platform performance
            await DatabaseUtils.updatePlatformPerformance({
              platformName: result.platform,
              senderCountry: request.senderCountry,
              recipientCountry: request.recipientCountry,
              success: result.success,
              responseTime: responseTime,
            });
          }

          return result;
        } catch (error) {
          const responseTime = Date.now() - platformStartTime;

          logger.error(`Integration ${integration.constructor.name} failed:`, error);

          // Log failed attempt
          await DatabaseUtils.updatePlatformPerformance({
            platformName: integration.constructor.name.replace("Integration", ""),
            senderCountry: request.senderCountry,
            recipientCountry: request.recipientCountry,
            success: false,
            responseTime: responseTime,
          });

          return null;
        }
      }),
    );

    // Filter successful results
    const successfulResults = results
      .filter(
        (result): result is PromiseFulfilledResult<ExchangeRateResult> =>
          result.status === "fulfilled" && result.value !== null && result.value.success,
      )
      .map((result) => result.value);

    // Rank platforms by receive amount (best to worst)
    successfulResults.sort((a, b) => b.receiveAmount - a.receiveAmount);

    // Update platform rankings
    await this.updatePlatformRankings(successfulResults, request);

    const totalTime = Date.now() - startTime;

    logger.info("Exchange rate comparison completed", {
      totalTime: `${totalTime}ms`,
      successfulPlatforms: successfulResults.length,
      totalPlatforms: this.integrations.length,
      bestPlatform: successfulResults[0]?.platform,
      bestReceiveAmount: successfulResults[0]?.receiveAmount,
    });

    return successfulResults;
  }

  // Update platform rankings based on performance
  private async updatePlatformRankings(
    results: ExchangeRateResult[],
    request: ExchangeRateRequest,
  ) {
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const rank = i + 1;
      const isWinner = rank === 1;

      await DatabaseUtils.updatePlatformPerformance({
        platformName: result.platform,
        senderCountry: request.senderCountry,
        recipientCountry: request.recipientCountry,
        success: true,
        responseTime: result.responseTime || 0,
        isWinner: isWinner,
        rank: rank,
      });
    }
  }

  // Get available platforms for a specific corridor
  getAvailablePlatforms(senderCountry: string, recipientCountry: string): string[] {
    // This could be enhanced to check platform availability based on corridor
    return this.integrations.map((integration) =>
      integration.constructor.name.replace("Integration", ""),
    );
  }

  // Health check for all integrations
  async healthCheck(): Promise<{ [platform: string]: boolean }> {
    const healthStatus: { [platform: string]: boolean } = {};

    const healthChecks = await Promise.allSettled(
      this.integrations.map(async (integration) => {
        try {
          // Simple health check - attempt to get a rate for a common corridor
          const testRequest: ExchangeRateRequest = {
            senderCountry: "US",
            recipientCountry: "NG",
            amount: 100,
            fetchHistoricalData: false,
          };

          const result = await integration.getExchangeRate(testRequest);
          const platformName = integration.constructor.name.replace("Integration", "");

          return {
            platform: platformName,
            healthy: result !== null && result.success,
          };
        } catch (error) {
          const platformName = integration.constructor.name.replace("Integration", "");
          return {
            platform: platformName,
            healthy: false,
          };
        }
      }),
    );

    healthChecks.forEach((check) => {
      if (check.status === "fulfilled") {
        healthStatus[check.value.platform] = check.value.healthy;
      } else {
        // If the health check itself failed, mark as unhealthy
        healthStatus["Unknown"] = false;
      }
    });

    return healthStatus;
  }
}

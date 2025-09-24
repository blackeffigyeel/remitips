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
import { PLATFORM_CONFIG } from '../integrations/platforms.config';

export class IntegrationManager {
  private integrations: BaseIntegration[];

  constructor() {
    this.integrations = this.initializeEnabledPlatforms();
  }

  // Initialize only enabled platforms
  private initializeEnabledPlatforms(): BaseIntegration[] {
    const platforms = [
      { name: 'Wise', enabled: PLATFORM_CONFIG.enabledPlatforms.Wise, class: WiseIntegration },
      { name: 'Remitly', enabled: PLATFORM_CONFIG.enabledPlatforms.Remitly, class: RemitlyIntegration },
      { name: 'MoneyGram', enabled: PLATFORM_CONFIG.enabledPlatforms.MoneyGram, class: MoneyGramIntegration },
      { name: 'WorldRemit', enabled: PLATFORM_CONFIG.enabledPlatforms.WorldRemit, class: WorldRemitIntegration },
      { name: 'Airwallex', enabled: PLATFORM_CONFIG.enabledPlatforms.Airwallex, class: AirwallexIntegration },
      { name: 'Revolut', enabled: PLATFORM_CONFIG.enabledPlatforms.Revolut, class: RevolutIntegration },
      { name: 'XE', enabled: PLATFORM_CONFIG.enabledPlatforms.XE, class: XEIntegration },
      { name: 'Ria', enabled: PLATFORM_CONFIG.enabledPlatforms.Ria, class: RiaIntegration },
      { name: 'Xoom', enabled: PLATFORM_CONFIG.enabledPlatforms.Xoom, class: XoomIntegration },
    ];

    // Filter out disabled platforms and create instances
    return platforms
      .filter(platform => platform.enabled)
      .map(platform => new platform.class())
      .filter(Boolean) as BaseIntegration[];
  }

  // Get exchange rates from all platforms
  async getAllRates(request: ExchangeRateRequest): Promise<ExchangeRateResult[]> {
    const startTime = Date.now();

    // Use getPlatformName method instead of accessing protected property directly
    const enabledPlatformNames = this.integrations.map(integration => this.getPlatformName(integration));

    logger.info("Starting exchange rate comparison", {
      senderCountry: request.senderCountry,
      recipientCountry: request.recipientCountry,
      amount: request.amount,
      platformCount: this.integrations.length,
      enabledPlatforms: enabledPlatformNames,
    });

    // Check for restricted platforms
    const filteredIntegrations = this.integrations.filter(integration => 
      !this.isPlatformRestricted(this.getPlatformName(integration), request)
    );

    // Execute all integrations in parallel - USE filteredIntegrations, not this.filteredIntegrations
    const results = await Promise.allSettled(
      filteredIntegrations.map(async (integration: BaseIntegration) => {
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
        } catch (error: any) {
          const responseTime = Date.now() - platformStartTime;

          const platformName = this.getPlatformName(integration);
          logger.error(`Integration ${platformName} failed:`, {
            error: error.message,
            platform: platformName,
            corridor: `${request.senderCountry}-${request.recipientCountry}`
          });

          // Log failed attempt
          try {
            await DatabaseUtils.updatePlatformPerformance({
              platformName: platformName,
              senderCountry: request.senderCountry,
              recipientCountry: request.recipientCountry,
              success: false,
              responseTime: responseTime,
            });
          } catch (dbError) {
            logger.error("Failed to log platform performance for failed request:", dbError);
          }

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
    successfulResults.sort((a: ExchangeRateResult, b: ExchangeRateResult) => b.receiveAmount - a.receiveAmount);

    // Update platform rankings
    await this.updatePlatformRankings(successfulResults, request);

    const totalTime = Date.now() - startTime;

    logger.info("Exchange rate comparison completed", {
      totalTime: `${totalTime}ms`,
      successfulPlatforms: successfulResults.length,
      totalPlatforms: this.integrations.length,
      enabledPlatformsCount: filteredIntegrations.length,
      bestPlatform: successfulResults[0]?.platform,
      bestReceiveAmount: successfulResults[0]?.receiveAmount,
    });

    return successfulResults;
  }

  // Check platform restrictions with proper type safety
  private isPlatformRestricted(platformName: string, request: ExchangeRateRequest): boolean {
    // Type-safe access to restrictions
    const platformKey = platformName as keyof typeof PLATFORM_CONFIG.restrictions;
    const restrictions = PLATFORM_CONFIG.restrictions[platformKey];
    
    if (!restrictions) return false;

    const recipientCurrency = this.getCurrencyCode(request.recipientCountry);
    
    // Type-safe property access
    const isCountryRestricted = 'disabledCountries' in restrictions ? 
      restrictions.disabledCountries.includes(request.recipientCountry) : false;
    
    const isCurrencyRestricted = 'disabledCurrencies' in restrictions ? 
      restrictions.disabledCurrencies.includes(recipientCurrency) : false;
    
    if (isCountryRestricted || isCurrencyRestricted) {
      logger.debug(`Platform ${platformName} restricted for corridor ${request.senderCountry}-${request.recipientCountry}`);
      return true;
    }
    
    return false;
  }

  // Helper method to get platform name safely
  private getPlatformName(integration: BaseIntegration): string {
    // Extract platform name from constructor name as fallback
    return integration.constructor.name.replace("Integration", "");
  }

  // Currency conversion helper method
  private getCurrencyCode(country: string): string {
    const currencyMap: { [key: string]: string } = {
      US: "USD", USA: "USD",
      NG: "NGN", NGA: "NGN",
      GB: "GBP", UK: "GBP",
      CA: "CAD", MX: "MXN",
      PH: "PHP", IN: "INR",
      KE: "KES", GH: "GHS",
      ZA: "ZAR", EU: "EUR",
      DE: "EUR", FR: "EUR",
      IT: "EUR", ES: "EUR",
      AU: "AUD", NZ: "NZD",
      JP: "JPY", CN: "CNY",
      BR: "BRL", AR: "ARS",
      CL: "CLP", CO: "COP",
      PE: "PEN", TH: "THB",
      VN: "VND", ID: "IDR",
      MY: "MYR", SG: "SGD",
      KR: "KRW", AE: "AED",
      SA: "SAR", EG: "EGP",
      MA: "MAD", TN: "TND",
      DZ: "DZD", UY: "UYU",
    };

    return currencyMap[country.toUpperCase()] || "USD";
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

  // Get available platforms for a specific corridor (only returns available (enabled + not restricted) platforms)
  getAvailablePlatforms(senderCountry: string, recipientCountry: string): string[] {
    const testRequest: ExchangeRateRequest = {
      senderCountry,
      recipientCountry,
      amount: 100, // Default amount for checking availability
      fetchHistoricalData: false
    };

    return this.integrations
      .filter(integration => !this.isPlatformRestricted(this.getPlatformName(integration), testRequest))
      .map(integration => this.getPlatformName(integration));
  }

  // Health check for all integrations
  async healthCheck(): Promise<{ [platform: string]: boolean }> {
    const healthStatus: { [platform: string]: boolean } = {};

    const healthChecks = await Promise.allSettled(
      this.integrations.map(async (integration: BaseIntegration) => {
        try {
          // Simple health check - attempt to get a rate for a common corridor
          const testRequest: ExchangeRateRequest = {
            senderCountry: "US",
            recipientCountry: "NG",
            amount: 100,
            fetchHistoricalData: false,
          };

          const platformName = this.getPlatformName(integration);

          // Skip if platform is restricted for this test corridor
          if (this.isPlatformRestricted(platformName, testRequest)) {
            return {
              platform: platformName,
              healthy: false,
              reason: "restricted"
            };
          }

          const result = await integration.getExchangeRate(testRequest);

          return {
            platform: platformName,
            healthy: result !== null && result.success,
          };
        } catch (error) {
          const platformName = this.getPlatformName(integration);
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
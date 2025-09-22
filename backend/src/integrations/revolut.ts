import { BaseIntegration, type ExchangeRateRequest, type ExchangeRateResult } from "./base";

export class RevolutIntegration extends BaseIntegration {
  constructor() {
    super("Revolut", "https://www.revolut.com");

    // Add Revolut specific headers
    this.client.defaults.headers.common["x-api-version"] = "v2";
  }

  async getExchangeRate(request: ExchangeRateRequest): Promise<ExchangeRateResult | null> {
    try {
      const { result, responseTime } = await this.measureResponseTime(async () => {
        const senderCurrency = this.getCurrencyCode(request.senderCountry);
        const recipientCurrency = this.getCurrencyCode(request.recipientCountry);

        const response = await this.client.get("/api/remittance/routes", {
          params: {
            amount: request.amount * 100, // Revolut expects amount in minor units
            isRecipientAmount: false,
            recipientCountry: request.recipientCountry,
            recipientCurrency: recipientCurrency,
            senderCountry: request.senderCountry,
            senderCurrency: senderCurrency,
          },
        });

        return response.data;
      });

      if (result.routes && result.routes.length > 0) {
        const route = result.routes[0]; // Take the first (usually best) route
        const exchangeRate = result.rate.rate;

        // Get the best plan (usually the first one)
        const bestPlan = route.plans[0];
        const receiveAmount = bestPlan.totalRecipientAmount.amount;
        const sendAmount = bestPlan.senderAmountWithoutFees.amount;
        const totalFees = bestPlan.fees.total;
        const totalCost = bestPlan.totalSenderAmount.amount;

        return {
          platform: this.platformName,
          sendAmount: sendAmount / 100, // Convert back from minor units
          receiveAmount: receiveAmount / 100,
          exchangeRate: exchangeRate,
          fees: totalFees / 100,
          totalCost: totalCost / 100,
          responseTime,
          success: true,
        };
      }

      return null;
    } catch (error) {
      return this.handleError(error, request);
    }
  }
}

import { BaseIntegration, type ExchangeRateRequest, type ExchangeRateResult } from "./base";

export class XEIntegration extends BaseIntegration {
  constructor() {
    super("XE", "https://www.xe.com");
  }

  async getExchangeRate(request: ExchangeRateRequest): Promise<ExchangeRateResult | null> {
    try {
      const { result, responseTime } = await this.measureResponseTime(async () => {
        const sellCcy = this.getCurrencyCode(request.senderCountry);
        const buyCcy = this.getCurrencyCode(request.recipientCountry);

        const response = await this.client.get("/api/send-money-tables/", {
          params: {
            sellCcy: sellCcy,
            buyCcy: buyCcy,
            userCountry: request.recipientCountry,
            countryTo: request.recipientCountry,
            deliveryMethod: "BankAccount",
            settlementMethod: "BankTransfer",
          },
        });

        return response.data;
      });

      if (result && Array.isArray(result) && result.length > 0) {
        // Find the closest amount to our request
        const closestEntry = result.reduce((prev, curr) => {
          return Math.abs(curr.sell - request.amount) < Math.abs(prev.sell - request.amount)
            ? curr
            : prev;
        });

        if (closestEntry) {
          const receiveAmount = Number.parseFloat(closestEntry.buy.replace(/,/g, ""));
          const sendAmount = closestEntry.sell;
          const exchangeRate = receiveAmount / sendAmount;

          // XE typically charges a margin on the exchange rate rather than explicit fees
          // Estimate fees as 2-3% of the send amount
          const estimatedFees = sendAmount * 0.025; // 2.5% typical margin

          return {
            platform: this.platformName,
            sendAmount: sendAmount,
            receiveAmount: receiveAmount,
            exchangeRate: exchangeRate,
            fees: estimatedFees,
            totalCost: sendAmount,
            responseTime,
            success: true,
          };
        }
      }

      return null;
    } catch (error) {
      return this.handleError(error, request);
    }
  }
}

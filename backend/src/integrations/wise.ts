import { BaseIntegration, type ExchangeRateRequest, type ExchangeRateResult } from "./base";

export class WiseIntegration extends BaseIntegration {
  constructor() {
    super("Wise", "https://wise.com");
  }

  async getExchangeRate(request: ExchangeRateRequest): Promise<ExchangeRateResult | null> {
    try {
      const { result, responseTime } = await this.measureResponseTime(async () => {
        const sourceCurrency = this.getCurrencyCode(request.senderCountry);
        const targetCurrency = this.getCurrencyCode(request.recipientCountry);

        // Use Wise's currency converter endpoint
        const response = await this.client.get("/gb/currency-converter/ngn-to-usd-rate", {
          params: {
            amount: request.amount * 100, // Wise expects amount in minor units for some currencies
          },
        });

        return response.data;
      });

      // Parse Wise response (they return HTML, so we need to extract the rate)
      // For production, you would need to parse the HTML or use their official API
      // This is a simplified implementation based on the pattern shown

      // Fallback to their rates API if available
      const ratesResponse = await this.client.get("/rates/history+live", {
        params: {
          source: this.getCurrencyCode(request.senderCountry),
          target: this.getCurrencyCode(request.recipientCountry),
          length: 1,
          resolution: "hourly",
          unit: "day",
        },
      });

      if (ratesResponse.data && ratesResponse.data.length > 0) {
        const latestRate = ratesResponse.data[ratesResponse.data.length - 1];
        const exchangeRate = latestRate.value;
        const receiveAmount = request.amount * exchangeRate;

        // Wise typically charges a percentage fee + fixed fee
        const percentageFee = request.amount * 0.005; // 0.5% typical fee
        const fixedFee = 2.0; // $2 typical fixed fee
        const totalFees = percentageFee + fixedFee;

        return {
          platform: this.platformName,
          sendAmount: request.amount,
          receiveAmount: receiveAmount,
          exchangeRate: exchangeRate,
          fees: totalFees,
          totalCost: request.amount + totalFees,
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

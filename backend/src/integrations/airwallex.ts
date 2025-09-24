import { BaseIntegration, type ExchangeRateRequest, type ExchangeRateResult } from "./base";

export class AirwallexIntegration extends BaseIntegration {
  constructor() {
    super("Airwallex", "https://www.airwallex.com");
  }

  async getExchangeRate(request: ExchangeRateRequest): Promise<ExchangeRateResult | null> {
    try {
      const { result, responseTime } = await this.measureResponseTime(async () => {
        const sellCcy = this.getCurrencyCode(request.senderCountry);
        const buyCcy = this.getCurrencyCode(request.recipientCountry);

        const response = await this.client.get("/api/fx/fxRate/indicativeQuote", {
          params: {
            sellAmount: request.amount,
            sellCcy: sellCcy,
            buyCcy: buyCcy,
            feePercent: 1, // 1% fee
          },
        });

        return response.data;
      });

      if (result.buyAmount && result.clientRate) {
        const receiveAmount = result.buyAmount;
        const exchangeRate = result.clientRate;
        const sellAmount = result.sellAmount;

        // Calculate fees based on the difference between AWX rate and client rate
        const awxRate = result.awxRate;

        // console.log(`Airwallex AWX Rate data:`, JSON.stringify(result), `AWX Rate: ${awxRate}, Client Rate: ${exchangeRate}, Sell Amount: ${sellAmount}, Receive Amount: ${receiveAmount}`);

        const expectedReceive = sellAmount * awxRate;
        
        const feeAmount = (expectedReceive - receiveAmount) / awxRate;

        return {
          platform: this.platformName,
          sendAmount: sellAmount,
          receiveAmount: receiveAmount,
          exchangeRate: exchangeRate,
          fees: feeAmount,
          totalCost: sellAmount,
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

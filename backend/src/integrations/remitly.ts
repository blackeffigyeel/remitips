import { BaseIntegration, type ExchangeRateRequest, type ExchangeRateResult } from "./base";

export class RemitlyIntegration extends BaseIntegration {
  constructor() {
    super("Remitly", "https://api.remitly.io");
  }

  async getExchangeRate(request: ExchangeRateRequest): Promise<ExchangeRateResult | null> {
    try {
      const { result, responseTime } = await this.measureResponseTime(async () => {
        const sourceCurrency = this.getCurrencyCode(request.senderCountry);
        const targetCurrency = this.getCurrencyCode(request.recipientCountry);

        // Build conduit string as per Remitly API format
        const conduit = `${request.senderCountry}:${sourceCurrency}-${request.recipientCountry}:${targetCurrency}`;

        const response = await this.client.get("/v3/calculator/estimate", {
          params: {
            conduit: conduit,
            anchor: "SEND",
            amount: request.amount,
            purpose: "OTHER",
            customer_segment: "UNRECOGNIZED",
            strict_promo: false,
          },
        });

        return response.data;
      });

      if (result.estimate) {
        const estimate = result.estimate;
        const receiveAmount = Number.parseFloat(estimate.receive_amount);
        const sendAmount = Number.parseFloat(estimate.send_amount);
        const totalFee = Number.parseFloat(estimate.fee.total_fee_amount);
        const exchangeRate = Number.parseFloat(estimate.exchange_rate.base_rate);

        return {
          platform: this.platformName,
          sendAmount: sendAmount,
          receiveAmount: receiveAmount,
          exchangeRate: exchangeRate,
          fees: totalFee,
          totalCost: Number.parseFloat(estimate.total_charge_amount),
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

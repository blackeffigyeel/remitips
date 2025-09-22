import { BaseIntegration, type ExchangeRateRequest, type ExchangeRateResult } from "./base";

export class MoneyGramIntegration extends BaseIntegration {
  constructor() {
    super("MoneyGram", "https://www.moneygram.com");

    // Add MoneyGram specific headers
    this.client.defaults.headers.common["locale-header"] = "en-us";
    this.client.defaults.headers.common["referer"] =
      "https://www.moneygram.com/us/en/corridor/nigeria";
  }

  async getExchangeRate(request: ExchangeRateRequest): Promise<ExchangeRateResult | null> {
    try {
      const { result, responseTime } = await this.measureResponseTime(async () => {
        const senderCurrencyCode = this.getCurrencyCode(request.senderCountry);

        const response = await this.client.get("/api/send-money/fee-quote/v2", {
          params: {
            senderCountryCode: request.senderCountry,
            senderCurrencyCode: senderCurrencyCode,
            receiverCountryCode: request.recipientCountry,
            sendAmount: request.amount.toFixed(2),
          },
        });

        return response.data;
      });

      if (result.feeQuotesByCurrency) {
        const recipientCurrency = this.getCurrencyCode(request.recipientCountry);
        const quote = result.feeQuotesByCurrency[recipientCurrency];

        if (quote) {
          // Use promo rates if available, otherwise use regular rates
          const receiveAmount = quote.promo?.totalReceiveAmount || quote.totalReceiveAmount;
          const sendFee = quote.promo?.sendFee || quote.sendFee;
          const fxRate = quote.promo?.fxRate || quote.fxRate;
          const totalSendAmount = quote.promo?.totalSendAmount || quote.totalSendAmount;

          return {
            platform: this.platformName,
            sendAmount: quote.sendAmount,
            receiveAmount: receiveAmount,
            exchangeRate: fxRate,
            fees: sendFee,
            totalCost: totalSendAmount,
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

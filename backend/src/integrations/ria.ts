import { BaseIntegration, type ExchangeRateRequest, type ExchangeRateResult } from "./base";

export class RiaIntegration extends BaseIntegration {
  constructor() {
    super("Ria", "https://public.riamoneytransfer.com");
  }

  async getExchangeRate(request: ExchangeRateRequest): Promise<ExchangeRateResult | null> {
    try {
      const { result, responseTime } = await this.measureResponseTime(async () => {
        const currencyFrom = this.getCurrencyCode(request.senderCountry);

        const payload = {
          selections: {
            countryTo: request.recipientCountry,
            amountFrom: request.amount,
            amountTo: null,
            currencyFrom: currencyFrom,
            currencyTo: null,
            paymentMethod: "DebitCard",
            deliveryMethod: "OfficePickup",
            shouldCalcAmountFrom: false,
            shouldCalcVariableRates: true,
            state: null,
            agentToId: null,
            stateTo: null,
            agentToLocationId: null,
            promoCode: null,
            promoId: 0,
            transferReason: null,
            countryFrom: request.senderCountry,
          },
        };

        const response = await this.client.post("/MoneyTransferCalculator/Calculate", payload);
        return response.data;
      });

      if (result.model?.transferDetails?.calculations) {
        const calculations = result.model.transferDetails.calculations;
        const receiveAmount = calculations.amountTo;
        const sendAmount = calculations.amountFrom;
        const exchangeRate = calculations.exchangeRate;
        const transferFee = calculations.transferFee;
        const totalAmount = calculations.totalAmount;

        return {
          platform: this.platformName,
          sendAmount: sendAmount,
          receiveAmount: receiveAmount,
          exchangeRate: exchangeRate,
          fees: transferFee,
          totalCost: totalAmount,
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

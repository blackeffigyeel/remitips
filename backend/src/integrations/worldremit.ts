import { BaseIntegration, type ExchangeRateRequest, type ExchangeRateResult } from "./base";

export class WorldRemitIntegration extends BaseIntegration {
  constructor() {
    super("WorldRemit", "https://api.worldremit.com");
  }

  async getExchangeRate(request: ExchangeRateRequest): Promise<ExchangeRateResult | null> {
    try {
      const { result, responseTime } = await this.measureResponseTime(async () => {
        const sendCurrencyCode = this.getCurrencyCode(request.senderCountry);
        const receiveCurrencyCode = this.getCurrencyCode(request.recipientCountry);

        // WorldRemit uses GraphQL
        const query = {
          operationName: "createCalculation",
          variables: {
            amount: request.amount,
            type: "SEND",
            sendCountryCode: request.senderCountry,
            sendCurrencyCode: sendCurrencyCode,
            receiveCountryCode: request.recipientCountry,
            receiveCurrencyCode: receiveCurrencyCode,
            payOutMethodCode: "BNK", // Bank transfer
            correspondentId: "",
          },
          query: `mutation createCalculation($amount: BigDecimal!, $type: CalculationType!, $sendCountryCode: CountryCode!, $sendCurrencyCode: CurrencyCode!, $receiveCountryCode: CountryCode!, $receiveCurrencyCode: CurrencyCode!, $payOutMethodCode: String, $correspondentId: String) {
            createCalculation(
              calculationInput: {amount: $amount, send: {country: $sendCountryCode, currency: $sendCurrencyCode}, type: $type, receive: {country: $receiveCountryCode, currency: $receiveCurrencyCode}, payOutMethodCode: $payOutMethodCode, correspondentId: $correspondentId}
            ) {
              calculation {
                id
                isFree
                informativeSummary {
                  fee {
                    value {
                      amount
                      currency
                    }
                    type
                  }
                  totalToPay {
                    amount
                  }
                }
                send {
                  currency
                  amount
                }
                receive {
                  amount
                  currency
                }
                exchangeRate {
                  value
                }
              }
              errors {
                message
              }
            }
          }`,
        };

        const response = await this.client.post("/graphql", query);
        return response.data;
      });

      if (result.data?.createCalculation?.calculation) {
        const calculation = result.data.createCalculation.calculation;
        const receiveAmount = calculation.receive.amount;
        const sendAmount = calculation.send.amount;
        const exchangeRate = calculation.exchangeRate.value;
        const totalToPay = calculation.informativeSummary.totalToPay.amount;
        const fees = calculation.informativeSummary.fee?.value?.amount || 0;

        return {
          platform: this.platformName,
          sendAmount: sendAmount,
          receiveAmount: receiveAmount,
          exchangeRate: exchangeRate,
          fees: fees,
          totalCost: totalToPay,
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

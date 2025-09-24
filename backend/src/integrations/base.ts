import axios, { type AxiosInstance } from "axios";
import logger from "../utils/logger";

export interface ExchangeRateRequest {
  senderCountry: string;
  recipientCountry: string;
  amount: number;
  fetchHistoricalData: boolean;
}

export interface ExchangeRateResult {
  platform: string;
  sendAmount: number;
  receiveAmount: number;
  exchangeRate: number;
  fees: number;
  totalCost: number;
  responseTime?: number;
  success: boolean;
  error?: string;
}

export abstract class BaseIntegration {
  protected client: AxiosInstance;
  protected platformName: string;
  protected baseURL: string;
  protected timeout = 10000; // 10 seconds default timeout

  constructor(platformName: string, baseURL: string) {
    this.platformName = platformName;
    this.baseURL = baseURL;

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        "User-Agent": "Remitips/1.0.0 (Exchange Rate Comparison Service)",
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`${this.platformName} API Request:`, {
          method: config.method?.toUpperCase(),
          url: config.url,
          params: config.params,
        });
        return config;
      },
      (error) => {
        logger.error(`${this.platformName} Request Error:`, error);
        return Promise.reject(error);
      },
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`${this.platformName} API Response:`, {
          status: response.status,
          statusText: response.statusText,
        });
        return response;
      },
      (error) => {
        logger.error(`${this.platformName} Response Error:`, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: error.message,
        });
        return Promise.reject(error);
      },
    );
  }

  // Abstract method that each platform must implement
  abstract getExchangeRate(request: ExchangeRateRequest): Promise<ExchangeRateResult | null>;

  // Helper method to get currency code from country code
  protected getCurrencyCode(countryCode: string): string {
    const currencyMap: { [key: string]: string } = {
      US: "USD",
      USA: "USD",
      NG: "NGN",
      NGA: "NGN",
      GB: "GBP",
      UK: "GBP",
      CA: "CAD",
      MX: "MXN",
      PH: "PHP",
      IN: "INR",
      KE: "KES",
      GH: "GHS",
      ZA: "ZAR",
      EU: "EUR",
      DE: "EUR",
      FR: "EUR",
      IT: "EUR",
      ES: "EUR",
      AU: "AUD",
      NZ: "NZD",
      JP: "JPY",
      CN: "CNY",
      BR: "BRL",
      AR: "ARS",
      CL: "CLP",
      CO: "COP",
      PE: "PEN",
      TH: "THB",
      VN: "VND",
      ID: "IDR",
      MY: "MYR",
      SG: "SGD",
      KR: "KRW",
      AE: "AED",
      SA: "SAR",
      EG: "EGP",
      MA: "MAD",
    };

    return currencyMap[countryCode.toUpperCase()] || "USD";
  }

  // Helper method to handle API errors gracefully
  protected handleError(error: any, request: ExchangeRateRequest): ExchangeRateResult {
    let errorMessage = "Unknown error";

    if (error.response) {
      // HTTP error responses
      const status = error.response.status;

      switch (status) {
        case 403:
          errorMessage = "API access forbidden - check credentials or permissions";
          break;
        case 404:
          errorMessage = "API endpoint not found";
          break;
        case 500:
          errorMessage = "Remote server error";
          break;
        case 429:
          errorMessage = "Rate limit exceeded";
          break;
        default:
          errorMessage = error.response.data?.message || `HTTP ${status} error`;
      }
    } else if (error.request) {
      // Network errors
      errorMessage = "Network error - unable to reach API";
    } else {
      // Other errors
      errorMessage = error.message || "Unknown error occurred";
    }

    logger.warn(`${this.platformName} integration failed:`, {
      error: errorMessage,
      senderCountry: request.senderCountry,
      recipientCountry: request.recipientCountry,
      amount: request.amount,
    });

    return {
      platform: this.platformName,
      sendAmount: request.amount,
      receiveAmount: 0,
      exchangeRate: 0,
      fees: 0,
      totalCost: request.amount,
      success: false,
      error: errorMessage,
    };
  }

  // Helper method to measure response time
  protected async measureResponseTime<T>(
    operation: () => Promise<T>,
  ): Promise<{ result: T; responseTime: number }> {
    const startTime = Date.now();
    try {
      const result = await operation();
      const responseTime = Date.now() - startTime;
      return { result, responseTime };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      // Ensure we spread only if error is an object
      if (error && typeof error === "object") {
        throw { ...error, responseTime };
      } else {
        throw { message: String(error), responseTime };
      }
    }
  }
}

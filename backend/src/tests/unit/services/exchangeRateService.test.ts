import { ExchangeRateService } from "src/services/exchangeRateService";
import { IntegrationManager } from "src/utils/integrationManager";
import axios from "axios";
// import jest from "jest" // Declare the jest variable

// Mock dependencies
jest.mock("../../../src/utils/integrationManager");
jest.mock("axios");
jest.mock("../../../src/utils/database");

const mockedAxios = axios as jest.Mocked<typeof axios>;
const MockedIntegrationManager = IntegrationManager as jest.MockedClass<typeof IntegrationManager>;

describe("ExchangeRateService", () => {
  let service: ExchangeRateService;
  let mockIntegrationManager: jest.Mocked<IntegrationManager>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockIntegrationManager = new MockedIntegrationManager() as jest.Mocked<IntegrationManager>;
    service = new ExchangeRateService();

    // Replace the integration manager instance
    (service as any).integrationManager = mockIntegrationManager;
  });

  describe("compareRates", () => {
    const mockRequest = {
      senderCountry: "US",
      recipientCountry: "NG",
      amount: 100,
      fetchHistoricalData: false,
    };

    const mockOfficialRateResponse = {
      data: {
        result: "success",
        base_code: "USD",
        target_code: "NGN",
        conversion_rate: 1580.5,
        conversion_result: 158050,
        time_last_update_utc: "2024-01-01T00:00:00Z",
      },
    };

    const mockPlatformRates = [
      {
        platform: "Wise",
        sendAmount: 100,
        receiveAmount: 157500,
        exchangeRate: 1575,
        fees: 5,
        totalCost: 105,
        success: true,
        responseTime: 250,
      },
      {
        platform: "Remitly",
        sendAmount: 100,
        receiveAmount: 156800,
        exchangeRate: 1568,
        fees: 3,
        totalCost: 103,
        success: true,
        responseTime: 180,
      },
    ];

    beforeEach(() => {
      mockedAxios.get.mockResolvedValue(mockOfficialRateResponse);
      mockIntegrationManager.getAllRates.mockResolvedValue(mockPlatformRates);
    });

    it("should successfully compare exchange rates", async () => {
      const result = await service.compareRates(mockRequest);

      expect(result).toHaveProperty("senderCountry", "US");
      expect(result).toHaveProperty("recipientCountry", "NG");
      expect(result).toHaveProperty("sendingAmount", 100);
      expect(result).toHaveProperty("officialExchangeRate");
      expect(result).toHaveProperty("platforms");
      expect(result).toHaveProperty("winner");
      expect(result).toHaveProperty("metrics");

      expect(result.platforms).toHaveLength(2);
      expect(result.winner?.platform).toBe("Wise"); // Highest receive amount
      expect(result.metrics.platformCount).toBe(2);
    });

    it("should fetch official exchange rate correctly", async () => {
      await service.compareRates(mockRequest);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining("exchangerate-api.com"),
        expect.objectContaining({ timeout: 5000 }),
      );
    });

    it("should handle official exchange rate API errors", async () => {
      mockedAxios.get.mockRejectedValue(new Error("API Error"));

      await expect(service.compareRates(mockRequest)).rejects.toThrow(
        "Failed to compare exchange rates",
      );
    });

    it("should find the best rate correctly", async () => {
      const result = await service.compareRates(mockRequest);

      expect(result.winner?.platform).toBe("Wise");
      expect(result.winner?.receiveAmount).toBe(157500);
    });

    it("should calculate metrics correctly", async () => {
      const result = await service.compareRates(mockRequest);

      expect(result.metrics.averageReceiveAmount).toBe(157150); // (157500 + 156800) / 2
      expect(result.metrics.bestReceiveAmount).toBe(157500);
      expect(result.metrics.worstReceiveAmount).toBe(156800);
      expect(result.metrics.platformCount).toBe(2);
    });

    it("should handle empty platform rates", async () => {
      mockIntegrationManager.getAllRates.mockResolvedValue([]);

      const result = await service.compareRates(mockRequest);

      expect(result.winner).toBeNull();
      expect(result.platforms).toHaveLength(0);
      expect(result.metrics.platformCount).toBe(0);
    });

    it("should include historical data when requested", async () => {
      const requestWithHistory = { ...mockRequest, fetchHistoricalData: true };

      const result = await service.compareRates(requestWithHistory);

      expect(result).toHaveProperty("historicalData");
      expect(result.historicalData).toHaveProperty("periods");
      expect(result.historicalData).toHaveProperty("leaderboard");
      expect(result.historicalData).toHaveProperty("summary");
    });
  });

  describe("getCurrencyCode", () => {
    it("should return correct currency codes", () => {
      expect((service as any).getCurrencyCode("US")).toBe("USD");
      expect((service as any).getCurrencyCode("NG")).toBe("NGN");
      expect((service as any).getCurrencyCode("GB")).toBe("GBP");
      expect((service as any).getCurrencyCode("UNKNOWN")).toBe("USD"); // Default
    });
  });
});

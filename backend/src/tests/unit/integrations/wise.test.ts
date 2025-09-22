import { WiseIntegration } from "src/integrations/wise";
import axios from "axios";
// import jest from "jest"

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("WiseIntegration", () => {
  let integration: WiseIntegration;

  beforeEach(() => {
    integration = new WiseIntegration();
    jest.clearAllMocks();
  });

  const mockRequest = {
    senderCountry: "US",
    recipientCountry: "NG",
    amount: 100,
    fetchHistoricalData: false,
  };

  describe("getExchangeRate", () => {
    it("should return exchange rate data successfully", async () => {
      const mockResponse = {
        data: [
          {
            source: "USD",
            target: "NGN",
            value: 0.000633, // 1/1580
            time: Date.now(),
          },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await integration.getExchangeRate(mockRequest);

      expect(result).not.toBeNull();
      expect(result?.platform).toBe("Wise");
      expect(result?.success).toBe(true);
      expect(result?.sendAmount).toBe(100);
      expect(result?.receiveAmount).toBeGreaterThan(0);
    });

    it("should handle API errors gracefully", async () => {
      mockedAxios.get.mockRejectedValue(new Error("Network error"));

      const result = await integration.getExchangeRate(mockRequest);

      expect(result?.success).toBe(false);
      expect(result?.error).toBeDefined();
      expect(result?.platform).toBe("Wise");
    });

    it("should return null for invalid response", async () => {
      mockedAxios.get.mockResolvedValue({ data: [] });

      const result = await integration.getExchangeRate(mockRequest);

      expect(result).toBeNull();
    });
  });
});

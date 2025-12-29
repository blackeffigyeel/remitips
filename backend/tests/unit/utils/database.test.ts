import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import { DatabaseUtils } from "../../../utils/database";
import { prisma } from "src/database/client";
import { PrismaClient } from "@prisma/client";

// Create a deep mock of the Prisma client
const mockedPrisma = mockDeep<PrismaClient>();

// Mock the prisma instance
jest.mock("../../../database/client", () => ({
  prisma: mockedPrisma,
}));

describe("DatabaseUtils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("logApiUsage", () => {
    it("should log API usage successfully", async () => {
      const logData = {
        endpoint: "/api/v1/exchange-rates/compare",
        method: "GET",
        senderCountry: "US",
        recipientCountry: "NG",
        amount: 100,
        statusCode: 200,
        responseTime: 500,
      };

      mockedPrisma.apiUsageLog.create.mockResolvedValue({} as any);

      await DatabaseUtils.logApiUsage(logData);

      expect(mockedPrisma.apiUsageLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...logData,
          requestedAt: expect.any(Date),
        }),
      });
    });

    it("should handle logging errors gracefully", async () => {
      const logData = {
        endpoint: "/api/v1/exchange-rates/compare",
        method: "GET",
        statusCode: 200,
        responseTime: 500,
      };

      mockedPrisma.apiUsageLog.create.mockRejectedValue(new Error("Database error"));

      // Should not throw
      await expect(DatabaseUtils.logApiUsage(logData)).resolves.toBeUndefined();
    });
  });

  describe("getHistoricalData", () => {
    it("should retrieve historical data", async () => {
      const mockData = [
        {
          id: "1",
          senderCountry: "US",
          recipientCountry: "NG",
          platformData: JSON.stringify([]),
          createdAt: new Date(),
        },
      ];

      mockedPrisma.exchangeRateHistory.findMany.mockResolvedValue(mockData as any);

      const result = await DatabaseUtils.getHistoricalData("US", "NG", 30);

      expect(result).toEqual(mockData);
      expect(mockedPrisma.exchangeRateHistory.findMany).toHaveBeenCalledWith({
        where: {
          senderCountry: "US",
          recipientCountry: "NG",
          createdAt: {
            gte: expect.any(Date),
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    });
  });

  describe("hasDataForToday", () => {
    it("should return true when data exists for today", async () => {
      mockedPrisma.exchangeRateHistory.count.mockResolvedValue(1);

      const result = await DatabaseUtils.hasDataForToday("US", "NG");

      expect(result).toBe(true);
    });

    it("should return false when no data exists for today", async () => {
      mockedPrisma.exchangeRateHistory.count.mockResolvedValue(0);

      const result = await DatabaseUtils.hasDataForToday("US", "NG");

      expect(result).toBe(false);
    });
  });

  // describe('cleanupExpiredRecords', () => {
  //   it('should cleanup expired records successfully', async () => {
  //     const mockResult = [{ cleanup_expired_records: 5 }]
  //     mockedPrisma.$executeRaw.mockResolvedValue(mockResult as any)

  //     const result = await DatabaseUtils.cleanupExpiredRecords()

  //     expect(result).toBe(5)
  //     expect(mockedPrisma.$executeRaw).toHaveBeenCalledWith(
  //       expect.stringContaining('DELETE FROM exchange_rate_history')
  //     )
  //   })

  //   it('should handle cleanup errors gracefully', async () => {
  //     mockedPrisma.$executeRaw.mockRejectedValue(new Error('Cleanup failed'))

  //     await expect(DatabaseUtils.cleanupExpiredRecords()).rejects.toThrow('Cleanup failed')
  //   })
  // })

  // describe('getPlatformPerformance', () => {
  //   it('should retrieve platform performance data', async () => {
  //     const mockData = [
  //       {
  //         id: '1',
  //         platformName: 'PlatformA',
  //         senderCountry: 'US',
  //         recipientCountry: 'NG',
  //         totalRequests: 100,
  //         successfulRequests: 95,
  //       },
  //     ]

  //     mockedPrisma.platformPerformance.findMany.mockResolvedValue(mockData as any)

  //     const result = await DatabaseUtils.getPlatformPerformance('US', 'NG', 7)

  //     expect(result).toEqual(mockData)
  //     expect(mockedPrisma.platformPerformance.findMany).toHaveBeenCalledWith({
  //       where: {
  //         senderCountry: 'US',
  //         recipientCountry: 'NG',
  //         date: {
  //           gte: expect.any(Date),
  //         },
  //       },
  //       orderBy: {
  //         date: 'desc',
  //       },
  //     })
  //   })
  // })
});

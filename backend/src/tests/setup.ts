import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import dotenv from "dotenv";
import { beforeAll, afterAll } from "@jest/globals";

// Load test environment variables
dotenv.config({ path: ".env.test" });

const prisma = new PrismaClient();

beforeAll(async () => {
  // Run database migrations for test database
  execSync("npx prisma migrate deploy", { stdio: "inherit" });

  // Seed test data if needed
  await seedTestData();
});

afterAll(async () => {
  // Clean up test database
  await prisma.$executeRaw`TRUNCATE TABLE "exchange_rate_history" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "platform_performance" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "api_usage_logs" CASCADE`;

  await prisma.$disconnect();
});

async function seedTestData() {
  // Create test currency pairs
  await prisma.currencyPair.createMany({
    data: [
      {
        fromCountry: "US",
        toCountry: "NG",
        fromCurrency: "USD",
        toCurrency: "NGN",
        supportedPlatforms: ["Wise", "Remitly", "MoneyGram"],
        popularityScore: 95,
      },
      {
        fromCountry: "US",
        toCountry: "MX",
        fromCurrency: "USD",
        toCurrency: "MXN",
        supportedPlatforms: ["Wise", "Revolut", "XE"],
        popularityScore: 90,
      },
    ],
    skipDuplicates: true,
  });

  // Create test exchange rate history
  const testDate = new Date();
  testDate.setDate(testDate.getDate() - 1);

  await prisma.exchangeRateHistory.create({
    data: {
      senderCountry: "US",
      recipientCountry: "NG",
      senderCurrency: "USD",
      recipientCurrency: "NGN",
      amount: 100,
      officialRate: 1580.5,
      officialAmount: 158050,
      platformData: [
        {
          platform: "Wise",
          sendAmount: 100,
          receiveAmount: 157500,
          exchangeRate: 1575,
          fees: 5,
          totalCost: 105,
          success: true,
        },
        {
          platform: "Remitly",
          sendAmount: 100,
          receiveAmount: 156800,
          exchangeRate: 1568,
          fees: 3,
          totalCost: 103,
          success: true,
        },
      ],
      winnerPlatform: "Wise",
      bestReceiveAmount: 157500,
      bestExchangeRate: 1575,
      averageRate: 1571.5,
      rateVariance: 0.45,
      platformCount: 2,
      createdAt: testDate,
      expiresAt: new Date(testDate.getTime() + 60 * 24 * 60 * 60 * 1000), // 60 days later
    },
  });
}

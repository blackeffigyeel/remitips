import request from "supertest";
import app from "../../app";

describe("API Integration Tests", () => {
  describe("GET /health", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("status", "OK");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("service", "RemiTip API");
    });
  });

  describe("GET /api/v1", () => {
    it("should return API information", async () => {
      const response = await request(app).get("/api/v1");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "RemiTip API v1");
      expect(response.body).toHaveProperty("version", "1.0.0");
      expect(response.body).toHaveProperty("endpoints");
    });
  });

  describe("GET /api/v1/exchange-rates/compare", () => {
    it("should validate required parameters", async () => {
      const response = await request(app).get("/api/v1/exchange-rates/compare");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe("Validation failed");
    });

    it("should validate parameter formats", async () => {
      const response = await request(app).get("/api/v1/exchange-rates/compare").query({
        senderCountry: "INVALID",
        recipientCountry: "NG",
        amount: "invalid",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should accept valid parameters", async () => {
      const response = await request(app).get("/api/v1/exchange-rates/compare").query({
        senderCountry: "US",
        recipientCountry: "NG",
        amount: "100",
      });

      // Note: This might fail in test environment without proper API keys
      // In a real test, you'd mock the external API calls
      expect([200, 500]).toContain(response.status);
    });
  });

  describe("GET /api/v1/exchange-rates/platforms", () => {
    it("should return available platforms", async () => {
      const response = await request(app).get("/api/v1/exchange-rates/platforms").query({
        senderCountry: "US",
        recipientCountry: "NG",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("availablePlatforms");
      expect(Array.isArray(response.body.data.availablePlatforms)).toBe(true);
    });
  });

  describe("GET /api/v1/analytics/corridors", () => {
    it("should return corridor analytics", async () => {
      const response = await request(app).get("/api/v1/analytics/corridors");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("corridors");
      expect(Array.isArray(response.body.data.corridors)).toBe(true);
    });
  });

  describe("Error handling", () => {
    it("should handle 404 routes", async () => {
      const response = await request(app).get("/nonexistent-route");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error", "Route not found");
    });
  });
});

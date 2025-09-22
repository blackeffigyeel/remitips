import { Router } from "express";
import exchangeRatesRouter from "./exchangeRates";
import analyticsRouter from "./analytics";

const router = Router();

// Mount route modules
router.use("/exchange-rates", exchangeRatesRouter);
router.use("/analytics", analyticsRouter);

// API info endpoint
router.get("/", (req, res) => {
  res.json({
    message: "RemiTip API v1",
    version: "1.0.0",
    endpoints: {
      "GET /exchange-rates/compare": "Compare exchange rates across platforms",
      "GET /exchange-rates/health": "Platform health check",
      "GET /exchange-rates/platforms": "Get available platforms for corridor",
      "GET /analytics/platforms": "Get platform analytics for corridor",
      "GET /analytics/corridors": "Get corridor analytics",
      "GET /analytics/trends": "Get trend analysis for corridor",
      "GET /analytics/daily-summary": "Get daily summary report",
      "GET /analytics/scheduler/status": "Get scheduler status",
      "POST /analytics/scheduler/trigger/:jobType": "Trigger manual job",
      "GET /health": "API health check endpoint",
    },
  });
});

export default router;

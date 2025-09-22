import { Router } from "express";
import {
  getPlatformAnalytics,
  getCorridorAnalytics,
  getTrendAnalysis,
  getDailySummary,
  getSchedulerStatus,
  triggerManualJob,
} from "../controllers/analyticsController";
import { validateAnalyticsRequest } from "../middlewares/validation";

const router = Router();

// Analytics endpoints
router.get("/platforms", validateAnalyticsRequest, getPlatformAnalytics);
router.get("/corridors", getCorridorAnalytics);
router.get("/trends", validateAnalyticsRequest, getTrendAnalysis);
router.get("/daily-summary", getDailySummary);

// Scheduler endpoints
router.get("/scheduler/status", getSchedulerStatus);
router.post("/scheduler/trigger/:jobType", triggerManualJob);

export default router;

import { Router } from "express";
import {
  compareExchangeRates,
  healthCheck,
  getAvailablePlatforms,
} from "../controllers/exchangeRatesController";
import { validateExchangeRateRequest, validatePlatformRequest } from "../middlewares/validation";

const router = Router();

router.get("/compare", validateExchangeRateRequest, compareExchangeRates);

router.get("/health", healthCheck);

router.get("/platforms", validatePlatformRequest, getAvailablePlatforms);

export default router;

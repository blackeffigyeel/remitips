// API configuration and functions
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://localhost:9101/api/v1";

class APIError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.details = details;
  }
}

/**
 * Make API request with error handling
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new APIError(
        data.error?.message || "API request failed",
        response.status,
        data.error?.details,
      );
    }

    if (!data.success) {
      throw new APIError(
        data.error?.message || "API returned unsuccessful response",
        response.status,
        data.error?.details,
      );
    }

    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }

    // Network or other errors
    throw new APIError("Network error or server unavailable", 0, error.message);
  }
}

/**
 * Compare exchange rates across platforms
 */
export async function compareExchangeRates({
  senderCountry,
  recipientCountry,
  amount,
  fetchHistoricalData = false,
}) {
  const params = new URLSearchParams({
    senderCountry,
    recipientCountry,
    amount: amount.toString(),
    fetchHistoricalData: fetchHistoricalData.toString(),
  });

  return apiRequest(`/exchange-rates/compare?${params}`);
}

/**
 * Get platform health status
 */
export async function getPlatformHealth() {
  return apiRequest("/exchange-rates/health");
}

/**
 * Get available platforms for a corridor
 */
export async function getAvailablePlatforms(senderCountry, recipientCountry) {
  const params = new URLSearchParams({
    senderCountry,
    recipientCountry,
  });

  return apiRequest(`/exchange-rates/platforms?${params}`);
}

/**
 * Get platform analytics
 */
export async function getPlatformAnalytics({ senderCountry, recipientCountry, days = 30 }) {
  const params = new URLSearchParams({
    senderCountry,
    recipientCountry,
    days: days.toString(),
  });

  return apiRequest(`/analytics/platforms?${params}`);
}

/**
 * Get corridor analytics
 */
export async function getCorridorAnalytics(days = 30) {
  const params = new URLSearchParams({
    days: days.toString(),
  });

  return apiRequest(`/analytics/corridors?${params}`);
}

/**
 * Get trend analysis
 */
export async function getTrendAnalysis({
  senderCountry,
  recipientCountry,
  periods = "7d,14d,30d",
}) {
  const params = new URLSearchParams({
    senderCountry,
    recipientCountry,
    periods,
  });

  return apiRequest(`/analytics/trends?${params}`);
}

# RemiTips API Documentation

## Base URL
\`\`\`
https://api.remitips.com/api/v1
\`\`\`

## Authentication
Currently, the API is open and does not require authentication. Rate limiting is applied per IP address.

## Rate Limiting
- **Limit**: 100 requests per 15 minutes per IP
- **Headers**: Rate limit information is included in response headers

## Response Format
All API responses follow this structure:

\`\`\`json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "version": "1.0.0",
    "response_time": "250ms"
  }
}
\`\`\`

Error responses:
\`\`\`json
{
  "success": false,
  "error": {
    "message": "Error description",
    "details": [ ... ]
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
\`\`\`

## Endpoints

### Exchange Rates

#### Compare Exchange Rates
Compare exchange rates across all supported platforms.

\`\`\`http
GET /exchange-rates/compare
\`\`\`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sender_country` | string | Yes | 2-3 letter country code (e.g., "US", "GB") |
| `recipient_country` | string | Yes | 2-3 letter country code (e.g., "NG", "MX") |
| `amount` | number | Yes | Amount to send (1-1,000,000) |
| `fetch_historical_data` | boolean | No | Include historical analysis (default: false) |

**Example Request:**
\`\`\`bash
curl "https://api.remitips.com/api/v1/exchange-rates/compare?sender_country=US&recipient_country=NG&amount=100&fetch_historical_data=true"
\`\`\`

**Example Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "sender_country": "US",
    "sendingAmount": 100,
    "sendingCurrencyCode": "USD",
    "recipient_country": "NG",
    "recipient_currencyCode": "NGN",
    "officialExchangeRate": {
      "baseCurrency": "USD",
      "targetCurrency": "NGN",
      "conversionRate": 1580.5,
      "convertedAmount": 158050,
      "lastUpdate": "2024-01-01T00:00:00Z"
    },
    "platforms": [
      {
        "platform": "Wise",
        "sendAmount": 100,
        "receiveAmount": 157500,
        "exchangeRate": 1575,
        "fees": 5,
        "totalCost": 105,
        "response_time": 250,
        "success": true
      },
      {
        "platform": "Remitly",
        "sendAmount": 100,
        "receiveAmount": 156800,
        "exchangeRate": 1568,
        "fees": 3,
        "totalCost": 103,
        "response_time": 180,
        "success": true
      }
    ],
    "winner": {
      "platform": "Wise",
      "sendAmount": 100,
      "receiveAmount": 157500,
      "exchangeRate": 1575,
      "fees": 5,
      "totalCost": 105,
      "response_time": 250,
      "success": true
    },
    "metrics": {
      "averageReceiveAmount": 157150,
      "averageExchangeRate": 1571.5,
      "averageFees": 4,
      "best_receive_amount": 157500,
      "worstReceiveAmount": 156800,
      "spreadPercentage": 0.44,
      "official_rateComparison": -0.57,
      "platform_count": 2
    },
    "response_time": 450,
    "timestamp": "2024-01-01T00:00:00.000Z",
    "historicalData": {
      "periods": {
        "last1Days": { ... },
        "last7Days": { ... },
        "last14Days": { ... },
        "last30Days": { ... }
      },
      "leaderboard": [ ... ],
      "summary": { ... }
    }
  }
}
\`\`\`

#### Platform Health Check
Check the availability and performance of all platforms.

\`\`\`http
GET /exchange-rates/health
\`\`\`

**Example Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "status": "healthy",
    "platforms": {
      "Wise": true,
      "Remitly": true,
      "MoneyGram": false,
      "WorldRemit": true,
      "Airwallex": true,
      "Revolut": true,
      "XE": true,
      "Ria": true,
      "Xoom": true
    },
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
\`\`\`

#### Available Platforms
Get list of platforms that support a specific corridor.

\`\`\`http
GET /exchange-rates/platforms
\`\`\`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sender_country` | string | Yes | 2-3 letter country code |
| `recipient_country` | string | Yes | 2-3 letter country code |

**Example Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "sender_country": "US",
    "recipient_country": "NG",
    "availablePlatforms": [
      "Wise", "Remitly", "MoneyGram", "WorldRemit", "XE", "Ria"
    ],
    "count": 6
  }
}
\`\`\`

### Analytics

#### Platform Analytics
Get detailed performance analytics for platforms in a specific corridor.

\`\`\`http
GET /analytics/platforms
\`\`\`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sender_country` | string | Yes | 2-3 letter country code |
| `recipient_country` | string | Yes | 2-3 letter country code |
| `days` | number | No | Analysis period in days (1-365, default: 30) |

**Example Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "corridor": "US-NG",
    "period": "30 days",
    "platforms": [
      {
        "platform": "Wise",
        "totalComparisons": 45,
        "winCount": 28,
        "winRate": 62.22,
        "averageReceiveAmount": 157250,
        "averageExchangeRate": 1572.5,
        "averageFees": 5.2,
        "average_response_time": 245,
        "reliabilityScore": 87.5,
        "trendDirection": "improving",
        "lastSeen": "2024-01-01T00:00:00.000Z"
      }
    ],
    "summary": {
      "totalPlatforms": 6,
      "bestPlatform": "Wise",
      "averageWinRate": 16.67
    }
  }
}
\`\`\`

#### Corridor Analytics
Get analytics for all corridors showing popularity and performance metrics.

\`\`\`http
GET /analytics/corridors
\`\`\`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `days` | number | No | Analysis period in days (default: 30) |

**Example Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "period": "30 days",
    "corridors": [
      {
        "sender_country": "US",
        "recipient_country": "MX",
        "totalComparisons": 156,
        "averageAmount": 250.5,
        "popularityRank": 1,
        "bestPlatform": "Revolut",
        "averageSavings": 45.2,
        "volatilityScore": 12.3,
        "lastCompared": "2024-01-01T00:00:00.000Z"
      }
    ],
    "summary": {
      "totalCorridors": 25,
      "totalComparisons": 1250,
      "mostPopular": {
        "sender_country": "US",
        "recipient_country": "MX",
        "totalComparisons": 156
      }
    }
  }
}
\`\`\`

#### Trend Analysis
Get trend analysis showing how platform performance changes over time.

\`\`\`http
GET /analytics/trends
\`\`\`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sender_country` | string | Yes | 2-3 letter country code |
| `recipient_country` | string | Yes | 2-3 letter country code |
| `periods` | string | No | Comma-separated periods (e.g., "7d,14d,30d") |

**Example Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "corridor": "US-NG",
    "periods": ["7d", "14d", "30d"],
    "trends": [
      {
        "platform": "Wise",
        "period": "7d",
        "startRate": 1570,
        "endRate": 1575,
        "changePercentage": 0.32,
        "direction": "stable",
        "confidence": 85.2
      }
    ],
    "summary": {
      "totalTrends": 18,
      "improvingPlatforms": 3,
      "decliningPlatforms": 2,
      "stablePlatforms": 13
    }
  }
}
\`\`\`

#### Daily Summary
Get daily activity summary for a specific date.

\`\`\`http
GET /analytics/daily-summary
\`\`\`

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `date` | string | No | Date in YYYY-MM-DD format (default: today) |

**Example Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "date": "2024-01-01",
    "totalComparisons": 45,
    "uniqueCorridors": 12,
    "platform_performance": {
      "Wise": 15,
      "Remitly": 8,
      "MoneyGram": 5
    },
    "topCorridors": [
      { "corridor": "US-MX", "comparisons": 12 },
      { "corridor": "US-NG", "comparisons": 8 }
    ],
    "averageAmount": 185.5,
    "summary": "Processed 45 comparisons across 12 corridors"
  }
}
\`\`\`

### System

#### Scheduler Status
Get status of scheduled background jobs.

\`\`\`http
GET /analytics/scheduler/status
\`\`\`

**Example Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "isRunning": true,
    "nextJobs": [
      { "job": "Daily Cleanup", "next": "2:00 AM" },
      { "job": "Daily Summary", "next": "1:00 AM" },
      { "job": "Currency Popularity Update", "next": "Every 6 hours" },
      { "job": "Health Check", "next": "Every hour" },
      { "job": "Weekly Report", "next": "Sunday 3:00 AM" }
    ]
  }
}
\`\`\`

#### Trigger Manual Job
Manually trigger a scheduled job (useful for testing and maintenance).

\`\`\`http
POST /analytics/scheduler/trigger/{jobType}
\`\`\`

**Path Parameters:**
| Parameter | Description |
|-----------|-------------|
| `jobType` | Job type: `cleanup`, `summary`, `popularity`, `health`, `weekly` |

**Example Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "message": "Daily cleanup job triggered successfully"
  }
}
\`\`\`

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 404 | Not Found - Route doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |
| 503 | Service Unavailable - Platform health issues |

## Country Codes

Supported country codes (ISO 3166-1):

**Americas**: US, CA, MX, BR, AR, CL, CO, PE, UY
**Europe**: GB, DE, FR, IT, ES, NL, BE, AT, CH, SE, NO, DK, FI, PL, CZ, HU, RO, BG, HR
**Asia**: CN, JP, KR, IN, PK, BD, LK, TH, VN, PH, ID, MY, SG, KH, LA, MM
**Africa**: NG, KE, GH, ZA, EG, MA, TN, DZ, ET, UG, TZ, RW
**Oceania**: AU, NZ, FJ, PG
**Middle East**: AE, SA, QA, KW, BH, OM, IL, TR

## SDKs and Libraries

### JavaScript/Node.js
\`\`\`javascript
const axios = require('axios');

const remitips = {
  baseURL: 'https://api.remitips.com/api/v1',
  
  async compareRates(sender_country, recipient_country, amount, fetch_historical_data = false) {
    const response = await axios.get(`${this.baseURL}/exchange-rates/compare`, {
      params: { sender_country, recipient_country, amount, fetch_historical_data }
    });
    return response.data;
  }
};

// Usage
const rates = await remitips.compareRates('US', 'NG', 100, true);
console.log(rates.data.winner);
\`\`\`

### Python
\`\`\`python
import requests

class RemiTipsAPI:
    def __init__(self):
        self.base_url = "https://api.remitips.com/api/v1"
    
    def compare_rates(self, sender_country, recipient_country, amount, fetch_historical_data=False):
        params = {
            'sender_country': sender_country,
            'recipient_country': recipient_country,
            'amount': amount,
            'fetch_historical_data': fetch_historical_data
        }
        response = requests.get(f"{self.base_url}/exchange-rates/compare", params=params)
        return response.json()

# Usage
api = RemiTipsAPI()
rates = api.compare_rates('US', 'NG', 100, True)
print(rates['data']['winner'])
\`\`\`

## Webhooks (Coming Soon)

Future versions will support webhooks for real-time notifications:
- Rate change alerts
- Platform availability changes
- Daily/weekly report delivery

---

For more information, see the [main documentation](./README.md) or [integration guide](./INTEGRATION.md).

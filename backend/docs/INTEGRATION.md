# Platform Integration Guide

This guide explains how Remitips integrates with various remittance platforms and how to add new platform integrations.

## Integration Architecture

Each platform integration follows a standardized pattern using the `BaseIntegration` class. This ensures consistency, error handling, and performance monitoring across all platforms.

### Base Integration Structure

\`\`\`typescript
export abstract class BaseIntegration {
  protected client: AxiosInstance
  protected platform_name: string
  protected baseURL: string
  protected timeout = 10000

  // Abstract method each platform must implement
  abstract getExchangeRate(request: ExchangeRateRequest): Promise<ExchangeRateResult | null>
  
  // Helper methods for error handling, currency mapping, etc.
}
\`\`\`

## Existing Platform Integrations

### 1. Wise Integration

**API Endpoint**: `https://wise.com/rates/history+live`
**Method**: GET
**Features**: Real-time rates, historical data

\`\`\`typescript
// Example API call
GET /rates/history+live?source=USD&target=NGN&length=1&resolution=hourly&unit=day
\`\`\`

**Response Processing**:
- Extracts exchange rate from time-series data
- Calculates fees based on Wise's fee structure (0.5% + fixed fee)
- Handles rate conversion for different amount tiers

### 2. Remitly Integration

**API Endpoint**: `https://api.remitly.io/v3/calculator/estimate`
**Method**: GET
**Features**: Promotional rates, multiple delivery methods

\`\`\`typescript
// Example API call
GET /v3/calculator/estimate?conduit=USA:USD-NGA:NGN&anchor=SEND&amount=100&purpose=OTHER
\`\`\`

**Response Processing**:
- Parses conduit-based request format
- Handles promotional vs. regular rates
- Extracts fee breakdown and total costs

### 3. MoneyGram Integration

**API Endpoint**: `https://www.moneygram.com/api/send-money/fee-quote/v2`
**Method**: GET
**Features**: Multiple currency support, promotional offers

\`\`\`typescript
// Example API call
GET /api/send-money/fee-quote/v2?sender_countryCode=USA&sender_currencyCode=USD&receiverCountryCode=NGA&sendAmount=100.00
\`\`\`

**Response Processing**:
- Handles multiple currency quotes in single response
- Processes promotional rates when available
- Manages complex fee structures

### 4. WorldRemit Integration

**API Endpoint**: `https://api.worldremit.com/graphql`
**Method**: POST (GraphQL)
**Features**: GraphQL API, multiple payout methods

\`\`\`typescript
// GraphQL mutation
mutation createCalculation($amount: BigDecimal!, $type: CalculationType!, ...) {
  createCalculation(calculationInput: {...}) {
    calculation { ... }
  }
}
\`\`\`

**Response Processing**:
- Handles GraphQL response structure
- Processes multiple payout method options
- Manages complex calculation objects

### 5. Airwallex Integration

**API Endpoint**: `https://www.airwallex.com/api/fx/fxRate/indicativeQuote`
**Method**: GET
**Features**: Business-focused rates, FX margins

\`\`\`typescript
// Example API call
GET /api/fx/fxRate/indicativeQuote?sellAmount=100&sellCcy=USD&buyCcy=NGN&feePercent=1
\`\`\`

**Response Processing**:
- Calculates fees from rate margins
- Handles business-tier pricing
- Processes indicative vs. firm quotes

### 6. Revolut Integration

**API Endpoint**: `https://www.revolut.com/api/remittance/routes`
**Method**: GET
**Features**: Multiple plan tiers, weekend rates

\`\`\`typescript
// Example API call
GET /api/remittance/routes?amount=10000&isRecipientAmount=false&recipient_country=NG&sender_country=US
\`\`\`

**Response Processing**:
- Handles plan-based pricing (Standard, Premium, Metal)
- Processes weekend rate adjustments
- Manages route-based fee calculations

### 7. XE Integration

**API Endpoint**: `https://www.xe.com/api/protected/midmarket-converter`
**Method**: GET
**Features**: Mid-market rates, historical data

\`\`\`typescript
// Example API call
GET /api/protected/midmarket-converter?Amount=100&From=USD&To=NGN
\`\`\`

**Response Processing**:
- Uses mid-market rates as baseline
- Applies XE's margin for consumer rates
- Handles currency conversion precision

### 8. Ria Integration

**API Endpoint**: `https://www.riamoneytransfer.com/api/locations/send-money/estimate`
**Method**: GET
**Features**: Location-based pricing, cash pickup

\`\`\`typescript
// Example API call
GET /api/locations/send-money/estimate?from_country=US&to_country=NG&sendAmount=100&from_currency=USD&to_currency=NGN
\`\`\`

**Response Processing**:
- Handles location-based fee structures
- Processes cash pickup vs. bank deposit rates
- Manages promotional pricing

### 9. Xoom Integration

**API Endpoint**: `https://www.xoom.com/api/send-money/estimate`
**Method**: GET
**Features**: PayPal integration, instant transfers

\`\`\`typescript
// Example API call
GET /api/send-money/estimate?amount=100&from_country=US&to_country=NG&from_currency=USD&to_currency=NGN
\`\`\`

**Response Processing**:
- Integrates with PayPal fee structure
- Handles instant vs. standard transfer rates
- Processes promotional offers

## Adding New Platform Integrations

### Step 1: Create Integration Class

Create a new file in `src/integrations/` following the naming convention:

\`\`\`typescript
// src/integrations/newplatform.ts
import { BaseIntegration } from './base'
import { ExchangeRateRequest, ExchangeRateResult } from '../types/exchangeRate'

export class NewPlatformIntegration extends BaseIntegration {
  constructor() {
    super('NewPlatform', 'https://api.newplatform.com')
  }

  async getExchangeRate(request: ExchangeRateRequest): Promise<ExchangeRateResult | null> {
    try {
      // 1. Build API request
      const apiRequest = this.buildApiRequest(request)
      
      // 2. Make API call
      const response = await this.client.get('/endpoint', { params: apiRequest })
      
      // 3. Process response
      return this.processResponse(response.data, request)
      
    } catch (error) {
      await this.logError(error, request)
      return null
    }
  }

  private buildApiRequest(request: ExchangeRateRequest) {
    // Transform our standard request to platform-specific format
    return {
      from: request.sender_country,
      to: request.recipient_country,
      amount: request.amount,
      // ... platform-specific parameters
    }
  }

  private processResponse(data: any, request: ExchangeRateRequest): ExchangeRateResult {
    // Transform platform response to our standard format
    return {
      platform: this.platform_name,
      sendAmount: request.amount,
      receiveAmount: data.receiveAmount,
      exchangeRate: data.rate,
      fees: data.fees,
      totalCost: request.amount + data.fees,
      response_time: this.getResponseTime(),
      success: true
    }
  }
}
\`\`\`

### Step 2: Register Integration

Add the new integration to the platform registry:

\`\`\`typescript
// src/integrations/index.ts
import { NewPlatformIntegration } from './newplatform'

export const platformIntegrations = {
  // ... existing integrations
  'NewPlatform': new NewPlatformIntegration(),
}
\`\`\`

### Step 3: Add Platform Configuration

Update the platform configuration:

\`\`\`typescript
// src/config/platforms.ts
export const SUPPORTED_PLATFORMS = [
  // ... existing platforms
  {
    name: 'NewPlatform',
    displayName: 'New Platform',
    supportedCorridors: ['US-MX', 'US-NG'], // Add supported corridors
    features: ['instant', 'bank-deposit'],
    maxAmount: 10000,
    minAmount: 1
  }
]
\`\`\`

### Step 4: Add Tests

Create comprehensive tests for the new integration:

\`\`\`typescript
// tests/unit/integrations/newplatform.test.ts
import { NewPlatformIntegration } from '../../../src/integrations/newplatform'

describe('NewPlatformIntegration', () => {
  let integration: NewPlatformIntegration

  beforeEach(() => {
    integration = new NewPlatformIntegration()
  })

  describe('getExchangeRate', () => {
    it('should return valid exchange rate for supported corridor', async () => {
      // Mock API response
      const mockResponse = { /* ... */ }
      
      const result = await integration.getExchangeRate({
        sender_country: 'US',
        recipient_country: 'MX',
        amount: 100
      })

      expect(result).toBeDefined()
      expect(result?.platform).toBe('NewPlatform')
      expect(result?.receiveAmount).toBeGreaterThan(0)
    })

    it('should handle API errors gracefully', async () => {
      // Test error handling
    })
  })
})
\`\`\`

## Integration Best Practices

### 1. Error Handling

Always implement comprehensive error handling:

\`\`\`typescript
try {
  const response = await this.client.get('/endpoint')
  return this.processResponse(response.data)
} catch (error) {
  if (error.response?.status === 429) {
    // Rate limiting - implement backoff
    await this.handleRateLimit()
  } else if (error.response?.status >= 500) {
    // Server error - log and return null
    await this.logError(error, request)
  }
  return null
}
\`\`\`

### 2. Response Time Tracking

Track and log response times for monitoring:

\`\`\`typescript
const startTime = Date.now()
const response = await this.client.get('/endpoint')
const response_time = Date.now() - startTime

await this.logPerformance({
  platform: this.platform_name,
  response_time,
  success: true
})
\`\`\`

### 3. Currency Mapping

Handle currency code variations:

\`\`\`typescript
private mapCurrencyCode(code: string): string {
  const currencyMap = {
    'USD': 'US_DOLLAR',
    'EUR': 'EURO',
    // ... platform-specific mappings
  }
  return currencyMap[code] || code
}
\`\`\`

### 4. Rate Caching

Implement intelligent caching for frequently requested rates:

\`\`\`typescript
private async getCachedRate(key: string): Promise<ExchangeRateResult | null> {
  const cached = await this.cache.get(key)
  if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
    return cached.data
  }
  return null
}
\`\`\`

### 5. Fallback Mechanisms

Implement fallbacks for when primary endpoints fail:

\`\`\`typescript
async getExchangeRate(request: ExchangeRateRequest): Promise<ExchangeRateResult | null> {
  // Try primary endpoint
  let result = await this.tryPrimaryEndpoint(request)
  
  if (!result) {
    // Try fallback endpoint
    result = await this.tryFallbackEndpoint(request)
  }
  
  return result
}
\`\`\`

## Testing Integrations

### Unit Testing

Test each integration in isolation with mocked API responses:

\`\`\`bash
npm test -- --testPathPattern=integrations/newplatform
\`\`\`

### Integration Testing

Test with real API calls (use test credentials):

\`\`\`bash
npm run test:integration -- --grep="NewPlatform"
\`\`\`

### Load Testing

Test platform performance under load:

\`\`\`bash
npm run test:load -- --platform=NewPlatform
\`\`\`

## Monitoring and Maintenance

### Performance Monitoring

Each integration automatically logs:
- Response times
- Success/failure rates
- Error types and frequencies
- Rate limit encounters

### Health Checks

Platforms are automatically health-checked every hour:

\`\`\`typescript
// Automatic health check
const healthStatus = await integration.healthCheck()
if (!healthStatus.healthy) {
  await this.alerting.sendAlert({
    platform: 'NewPlatform',
    issue: 'Health check failed',
    details: healthStatus.error
  })
}
\`\`\`

### Rate Limit Management

Implement rate limit handling:

\`\`\`typescript
private async handleRateLimit(): Promise<void> {
  const backoffTime = this.calculateBackoff()
  await this.sleep(backoffTime)
  this.rateLimitCount++
}
\`\`\`

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Check API keys and credentials
   - Verify request signing if required
   - Check IP whitelisting

2. **Rate Limiting**
   - Implement exponential backoff
   - Use multiple API keys if available
   - Cache responses appropriately

3. **Currency Support**
   - Verify corridor support with platform
   - Check currency code mappings
   - Handle unsupported currencies gracefully

4. **Response Format Changes**
   - Monitor for API version updates
   - Implement flexible response parsing
   - Add comprehensive logging

### Debugging Tools

Enable debug logging:

\`\`\`bash
LOG_LEVEL=debug npm start
\`\`\`

Test specific platform:

\`\`\`bash
curl "http://localhost:9101/api/v1/exchange-rates/compare?sender_country=US&recipient_country=MX&amount=100" \
  -H "X-Debug-Platform: NewPlatform"
\`\`\`

## API Documentation

Each platform integration should document:
- Supported corridors
- Rate limits
- Authentication requirements
- Response formats
- Error codes
- Special features

## Security Considerations

### API Key Management

- Store API keys in environment variables
- Rotate keys regularly
- Use different keys for different environments
- Monitor key usage

### Request Security

- Validate all input parameters
- Sanitize currency codes and amounts
- Implement request signing where required
- Use HTTPS for all API calls

### Data Privacy

- Don't log sensitive user data
- Anonymize request logs
- Comply with platform data policies
- Implement data retention policies

---

For questions about specific platform integrations, refer to the platform's official API documentation or contact their developer support team.

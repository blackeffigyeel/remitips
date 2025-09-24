# Remitips API

Remitips is a comprehensive remittance exchange rate comparison platform that helps users find the best rates across multiple money transfer services. The API provides real-time rate comparisons, historical data analysis, and platform performance metrics.

## 🚀 Features

- **Real-time Rate Comparison**: Compare exchange rates across 9+ major remittance platforms
- **Historical Data Analysis**: Track rate trends and platform performance over time
- **Advanced Analytics**: Platform leaderboards, corridor analysis, and trend detection
- **Automated Data Management**: Scheduled jobs for data cleanup and report generation
- **Robust Security**: SQL injection protection, rate limiting, and comprehensive validation
- **High Performance**: Optimized database queries and efficient caching strategies

## 🏗️ Architecture

### Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **External APIs**: Integration with 9 remittance platforms
- **Scheduling**: Node-cron for automated tasks
- **Testing**: Jest with comprehensive test coverage
- **Logging**: Winston for structured logging

### Project Structure

```text
src/
├── app.ts                  # Application entry point
├── controllers/            # Request handlers
├── services/               # Business logic
├── integrations/           # Platform API integrations
├── middlewares/            # Custom middleware
├── routes/                 # API route definitions
├── utils/                  # Utility functions
├── database/               # Database client and utilities
├── types/                  # TypeScript type definitions
├── tests/
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── setup.ts            # Test configuration
└── scripts/
    ├── 001_create_database.sql      # Database setup
    ├── 002_seed_currency_pairs.sql  # Initial data
    └── 003_create_triggers_and_jobs.sql # Maintenance functions

docs/
├── README.md                # This file
├── API.md                   # API documentation
└── INTEGRATION.md           # Integration guide
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd remitips-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```

   Configure your environment variables:
   ```env
   NODE_ENV=development
   PORT=9101
   DATABASE_URL="postgresql://username:password@localhost:5432/remitips"
   EXCHANGE_RATE_API_KEY=your_api_key_here
   FRONTEND_URL=http://localhost:3000
   ```

4. **Database Setup**
   ```bash

   # Run migrations

   npm run prisma:migrate

   # Generate Prisma client

   npm run prisma:generate

   # Seed initial data

   psql -d remitips -f src/scripts/002_seed_currency_pairs.sql
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:9101`

## 📊 API Endpoints

### Exchange Rates

- `GET /api/v1/exchange-rates/compare` - Compare rates across platforms
- `GET /api/v1/exchange-rates/health` - Platform health check
- `GET /api/v1/exchange-rates/platforms` - Available platforms for corridor

### Analytics

- `GET /api/v1/analytics/platforms` - Platform performance analytics
- `GET /api/v1/analytics/corridors` - Corridor popularity and metrics
- `GET /api/v1/analytics/trends` - Trend analysis for specific corridors
- `GET /api/v1/analytics/daily-summary` - Daily activity summary

### System

- `GET /health` - API health check
- `GET /api/v1/analytics/scheduler/status` - Scheduled jobs status

See [API.md](./API.md) for detailed endpoint documentation.

## 🧪 Testing

```bash

# Run all tests

npm test

# Run tests in watch mode

npm run test:watch

# Run specific test file

npm test -- --testPathPattern=exchangeRateService
```

### Test Coverage

- Unit tests for all services and utilities
- Integration tests for API endpoints
- Mock implementations for external APIs
- Database testing with test fixtures

## 🔧 Configuration

### Environment Variables

| Variable                | Description                  | Default                 |
| ----------------------- | ---------------------------- | ----------------------- |
| `NODE_ENV`              | Environment mode             | `development`           |
| `PORT`                  | Server port                  | `3000`                  |
| `DATABASE_URL`          | PostgreSQL connection string | Required                |
| `EXCHANGE_RATE_API_KEY` | ExchangeRate-API key         | Required                |
| `FRONTEND_URL`          | CORS origin URL              | `http://localhost:3000` |
| `LOG_LEVEL`             | Logging level                | `info`                  |

### Supported Platforms

1. **Wise** - Global money transfers
2. **Remitly** - Digital remittance service
3. **MoneyGram** - Traditional money transfer
4. **WorldRemit** - Digital money transfer
5. **Airwallex** - Business payment platform
6. **Revolut** - Digital banking and transfers
7. **XE** - Currency exchange and transfers
8. **Ria** - Money transfer service
9. **Xoom** - PayPal's international transfer service

## 📈 Performance & Monitoring

### Database Optimization

- Indexed queries for common access patterns
- Automatic data cleanup (60-day TTL)
- Connection pooling and query optimization
- Partitioned tables for historical data

### Monitoring Features

- Response time tracking per platform
- Success/failure rate monitoring
- Platform availability health checks
- Automated alerting for service degradation

### Scheduled Jobs

- **Daily Cleanup** (2:00 AM): Remove expired records
- **Daily Summary** (1:00 AM): Generate activity reports
- **Popularity Update** (Every 6 hours): Update corridor rankings
- **Health Check** (Hourly): Monitor platform availability
- **Weekly Report** (Sunday 3:00 AM): Comprehensive analytics

## 🔒 Security

### Implemented Measures

- SQL injection prevention middleware
- Rate limiting (100 requests per 15 minutes)
- Input validation and sanitization
- CORS configuration
- Helmet.js security headers
- Request/response logging

### Data Privacy

- No sensitive user data storage
- Anonymized usage analytics
- Secure API key management
- Encrypted database connections

## 🚀 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure production database
- [ ] Set up SSL certificates
- [ ] Configure monitoring and alerting
- [ ] Set up backup strategies
- [ ] Configure log rotation
- [ ] Set up CI/CD pipeline

### Docker Support

```dockerfile

# Dockerfile example

```Docker
FROM node:18-alpine
WORKDIR /app
COPY package\*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 9101
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow conventional commit messages
- Ensure all tests pass

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

For questions, issues, or contributions:

- Create an issue on GitHub
- Check the [API documentation](./API.md)
- Review the [integration guide](./INTEGRATION.md)

---

**Built with ❤️ for the global remittance community**

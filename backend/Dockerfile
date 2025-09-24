# Build stage
FROM node:20-alpine3.18 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy Prisma schema from src/prisma to prisma/ in container
COPY src/prisma ./prisma/

# Install all dependencies for build
RUN npm ci

# Generate Prisma client with explicit schema path
RUN npx prisma generate --schema=./prisma/schema.prisma

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine3.18

# Create app user and group for security
RUN addgroup app && adduser -S -G app app

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy Prisma schema from src/prisma to prisma/ in container
COPY src/prisma ./prisma/

# Install only production dependencies
RUN npm ci --only=production

# Generate Prisma client for production with explicit schema path
RUN npx prisma generate --schema=./prisma/schema.prisma

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
# Copy any other necessary files
COPY --from=builder /app/package.json ./package.json

# Create logs directory with proper permissions BEFORE switching to app user
USER root
RUN mkdir -p /app/logs && chown -R app:app /app/logs
USER app

# Expose the port for the backend server
EXPOSE 9101

# Default command (production)
CMD ["npm", "start"]

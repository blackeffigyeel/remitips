# Use a lightweight Node.js image as base
FROM node:20-alpine3.18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first for caching
COPY package*.json ./

# Install only production dependencies to keep image lean
RUN npm ci --only=production && npm cache clean --force

# Copy the rest of the source code
COPY . .

# Build the Next.js app for production
RUN npm run build

# Expose the port that the Next.js server will listen on
EXPOSE 3000

# Default command to run in production
CMD ["npm", "run", "start"]

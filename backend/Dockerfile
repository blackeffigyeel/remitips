# Use a lightweight Node.js image as base
FROM node:20-alpine3.18

# Create app user and group for security
RUN addgroup app && adduser -S -G app app

# Switch to app user
USER app

# Set working directory inside container
WORKDIR /app

# Copy package.json and package-lock.json first for caching
COPY package*.json ./

# Switch to root temporarily to change permissions
USER root
# Change ownership of the working directory to the app user
# chown -R <user>:<group> <directory>
# chown command changes the user and/or group ownership of for given file.
RUN chown -R app:app .

# Switch back to app user
USER app

# Install production dependencies only
RUN npm ci --only=production

# Copy the rest of the source code
COPY . .

# Compile TypeScript into dist/
RUN npm run build

# Expose the port for the backend server
EXPOSE 9101

# Default command (production)
CMD ["npm", "start"]

# Optional: for development, override CMD in docker-compose with "npm run dev"

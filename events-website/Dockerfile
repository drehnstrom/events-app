# Use official Node.js LTS image
FROM node:20-alpine

ARG buildtime
ENV BUILDTIME $buildtime

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (ci is more reliable than install for Docker)
RUN npm ci --omit=dev

# Copy application code
COPY . .

# Run as non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

# Start the Express app
CMD ["node", "server.js"]

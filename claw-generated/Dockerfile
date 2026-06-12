# Build stage
FROM node:18-alpine as builder

# Set working directory
WORKDIR /app

# Copy project files
COPY package*.json ./
COPY src ./src
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Build the app
RUN npm run build

# Runtime stage
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy built artifacts from builder stage
COPY --from=builder /app/dist ./dist

# Add healthcheck
HEALTHCHECK CMD curl -f http://localhost:3000/health || exit 1

# Start the app
CMD ["npm", "start"]
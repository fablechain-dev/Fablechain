# Use the official Node.js image as the base
FROM node:16-alpine as base

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Use a smaller runtime image
FROM node:16-alpine as runtime
WORKDIR /app
COPY --from=base /app/dist .
CMD ["node", "index.js"]
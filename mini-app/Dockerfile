# Stage 1: Build Stage
FROM node:20.13.1-alpine3.20 AS build-stage

# ARG for build-time variables
ARG NODE_ENV

# Set environment variable for build stage
ENV NODE_ENV=${NODE_ENV}

# Set working directory
WORKDIR /app

# Copy package.json and pnpm-lock.yaml to install dependencies
COPY package.json pnpm-lock.yaml ./

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application files
COPY . .

# Build the application
RUN pnpm run build

# Stage 2: Production Stage for mini-app and mini-app-cron
FROM node:20.13.1-alpine3.20 AS production-stage

# ARG for build-time environment variables
ARG NODE_ENV

# Set environment variable for production
ENV NODE_ENV=${NODE_ENV}

# Copy the .env file for runtime environment variables
#COPY .env /app/.env

# Set working directory
WORKDIR /app

# Copy the build output and node_modules from the build stage
COPY --from=build-stage /app/dist ./dist
COPY --from=build-stage /app/node_modules ./node_modules

# Expose necessary port (for mini-app)
EXPOSE 3000

# Default command (mini-app and mini-app-cron will use different commands)
CMD ["node", "dist/main.js"]

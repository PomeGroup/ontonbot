# Stage 1: Build Stage
FROM node:20.13.1-alpine3.20 AS build-stage

# ARG for build-time variables
ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}

# Set working directory
WORKDIR /app

# Copy the necessary files for installing dependencies
COPY package.json pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Build the Next.js application
RUN pnpm run build

# Stage 2: Production Stage for `mini-app` and `mini-app-cron`
FROM node:20.13.1-alpine3.20 AS production-stage

# ARG for build-time environment variables
ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}

# Copy .env file for runtime variables
COPY .env /app/.env

# Set working directory
WORKDIR /app

# Copy build output and node_modules from the build stage
COPY --from=build-stage /app/.next ./.next
COPY --from=build-stage /app/node_modules ./node_modules
COPY --from=build-stage /app/public ./public
COPY --from=build-stage /app/package.json ./package.json

# Expose the necessary port for mini-app (Next.js)
EXPOSE 3000

# Default command for `mini-app`
CMD ["pnpm", "run", "start"]

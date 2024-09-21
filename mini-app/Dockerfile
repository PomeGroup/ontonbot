# Stage 1: Build Stage
FROM node:20.13.1-alpine3.20 AS build-stage

# ARG for build-time variables
ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}

# Set working directory
WORKDIR /app

# Copy necessary files for installing dependencies
COPY package.json pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy the rest of the application, including Next.js and TypeScript configs
COPY . .

# Build the Next.js application
RUN pnpm run build

# Build TypeScript files for the app and cron
RUN pnpm run build-ts

# Debug: List the contents of /app to verify the dist folder
RUN ls -l /app

# Stage 2: Production Stage for `mini-app-cron`
FROM node:20.13.1-alpine3.20 AS production-stage

# ARG for build-time environment variables
ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}

# Install pnpm in the production stage to ensure it's available
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy necessary configs
COPY next.config.js ./next.config.js
COPY tsconfig.json ./tsconfig.json
COPY tailwind.config.js ./tailwind.config.js

# Copy the build output, public files, and node_modules from the build stage
COPY --from=build-stage /app/.next ./.next
COPY --from=build-stage /app/node_modules ./node_modules
COPY --from=build-stage /app/public ./public
COPY --from=build-stage /app/package.json ./package.json

# Copy the compiled TypeScript files from the build stage
COPY --from=build-stage /app/dist ./dist

# Expose the necessary port for mini-app (Next.js)
EXPOSE 3000

# Default command for `mini-app-cron`
CMD ["node", "dist/start.js"]

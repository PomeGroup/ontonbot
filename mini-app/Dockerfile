# Stage 1: Dependencies
FROM node:20.13.1-alpine3.20 AS dependencies

# Set working directory
WORKDIR /app

# Copy only the package.json and pnpm-lock.yaml for dependency caching
COPY package.json pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm \
    && pnpm install --frozen-lockfile

# Stage 2: Build Stage
FROM node:20.13.1-alpine3.20 AS build-stage

# ARG for build-time variables
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

RUN npm install -g pnpm
# Set working directory
WORKDIR /app

# Copy node_modules from the dependencies stage to reuse cached dependencies
COPY --from=dependencies /app/node_modules ./node_modules

# Copy the rest of the application (Next.js, TypeScript configs, and source code)
COPY . .

# Build the Next.js application
RUN pnpm run build

# Stage 3: Production Stage
FROM node:20.13.1-alpine3.20 AS production-stage

# ARG for build-time environment variables
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Install pnpm in the production stage to ensure it's available
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy the built Next.js application, node_modules, and the entire source code
COPY --from=build-stage /app/node_modules ./node_modules
COPY --from=build-stage /app/.next ./.next
COPY --from=build-stage /app/public ./public
COPY --from=build-stage /app/package.json ./package.json
COPY --from=build-stage /app/src ./src
COPY --from=build-stage /app/next.config.js ./next.config.js
COPY --from=build-stage /app/tsconfig.json ./tsconfig.json
COPY --from=build-stage /app/tailwind.config.js ./tailwind.config.js

# Expose the necessary port for mini-app (Next.js)
EXPOSE 3000

# Default command for the Next.js app
CMD ["pnpm", "run", "start"]

# Description: Dockerfile for telegram-bot
FROM node:21.1.0-alpine3.17 AS base
# Build arguments to accept environment variables
ARG TELEGRAM_BOT_PORT
# Export arguments as environment variables
ENV TELEGRAM_BOT_PORT=${TELEGRAM_BOT_PORT}
# Install pnpm globally
RUN npm install -g pnpm
# Set the working directory
WORKDIR /app

# stage: dependencies
FROM base AS dependencies
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY tsconfig.json ./
RUN pnpm install

# stage: with-files
FROM dependencies AS with-files
# Copy the entire project to be used
COPY . .

# stage: production
FROM with-files AS production
# Expose the default port for the telegram-bot
EXPOSE $TELEGRAM_BOT_PORT
# Run the app in production mode
CMD ["pnpm", "run", "start"]

# stage: development
FROM with-files AS development
# Expose the default port for development mode
EXPOSE $TELEGRAM_BOT_PORT
# Run the app in development mode
CMD ["pnpm", "run", "dev:server"]



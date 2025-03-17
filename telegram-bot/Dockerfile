# Description: Dockerfile for telegram-bot
FROM node:22-alpine3.19 AS base
# Build arguments to accept environment variables
ARG TELEGRAM_BOT_PORT
# Export arguments as environment variables
ENV TELEGRAM_BOT_PORT=${TELEGRAM_BOT_PORT}
RUN apk update
RUN apk add nano
RUN apk add --no-cache \
    bash \
    curl \
    ca-certificates \
    ffmpeg \
    freetype \
    ttf-dejavu
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
FROM base AS development
COPY . .
# Expose the default port for development mode
EXPOSE $TELEGRAM_BOT_PORT
# Run the app in development mode
CMD  export NODE_ENV=development && pnpm install && pnpm run dev:server



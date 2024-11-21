# Use an official Node runtime as the base image
FROM node:22-alpine3.19 AS base
ARG NEXT_PUBLIC_BACKEND_URL_CLIENT
ARG PORT_CLIENT_WEB
ENV NEXT_PUBLIC_BACKEND_URL_CLIENT=$NEXT_PUBLIC_BACKEND_URL_CLIENT
ENV PORT_CLIENT_WEB=$PORT_CLIENT_WEB
# Install necessary packages
RUN apk update && apk upgrade && \
  apk add \
  bash \
  curl \
  ca-certificates
# Install pnpm globally
RUN npm i -g pnpm
WORKDIR /app

FROM base AS with-files
# Copy package.json and package-lock.json
COPY . .

# Before the development stage
FROM with-files AS before-development
RUN pnpm install

# Stage for local development
FROM before-development AS development
# Expose the port the app runs on
EXPOSE $PORT_CLIENT_WEB
# Command to run the application in development mode
CMD node ./node_modules/next/dist/bin/next  dev --port  $PORT_CLIENT_WEB

# Stage for production build
FROM with-files AS build
# Build the application
RUN pnpm install
RUN pnpm run build

# Final stage for production
FROM build AS production
# Expose the port the app runs on
EXPOSE $PORT_CLIENT_WEB
# Command to run the application in production mode
CMD export NODE_ENV=development && node ./node_modules/next/dist/bin/next  start --port  $PORT_CLIENT_WEB




# Use an official Node runtime as the base image
FROM node:21.1.0-alpine3.17 AS base
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
WORKDIR /usr/src/app

FROM base AS dependencies
# Copy package.json and package-lock.json
COPY package*.json ./
# Install dependencies
RUN pnpm install --prod

FROM dependencies AS with-files
# Copy the rest of the application
COPY . .

# Stage for local development
FROM with-files AS development
RUN  pnpm install
# Expose the port the app runs on
EXPOSE $PORT_CLIENT_WEB
# Command to run the application in development mode
CMD node ./node_modules/next/dist/bin/next  dev --port  $PORT_CLIENT_WEB

# Stage for production build
FROM with-files AS build
# Build the application
RUN pnpm run build

# Final stage for production
FROM build AS production
# Expose the port the app runs on
EXPOSE $PORT_CLIENT_WEB
# Command to run the application in production mode
CMD node ./node_modules/next/dist/bin/next  start --port  $PORT_CLIENT_WEB




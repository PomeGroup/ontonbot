# Use an official Node runtime as the base image
FROM node:21.1.0-alpine3.17 AS base
ARG NEXT_PUBLIC_BACKEND_URL_CLIENT
ARG PORT_CLIENT_WEB
ENV NEXT_PUBLIC_BACKEND_URL_CLIENT=$NEXT_PUBLIC_BACKEND_URL_CLIENT
ENV PORT_CLIENT_WEB=$PORT_CLIENT_WEB
# Set the working directory
WORKDIR /usr/src/app
# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./
# Install dependencies
RUN npm install --prod

FROM base AS with-files
# Copy the rest of the application
COPY . .

# Stage for local development
FROM base AS development
# Install all dependencies
RUN npm install
# Expose the port the app runs on
EXPOSE $PORT_CLIENT_WEB
# Command to run the application in development mode
CMD npm run dev:server -- -p $PORT_CLIENT_WEB

# Stage for production build
FROM with-files AS build
# Build the application
RUN npm run build

# Final stage for production
FROM with-files AS production
# Expose the port the app runs on
EXPOSE $PORT_CLIENT_WEB
# Command to run the application in production mode
CMD npm run start -- -p $PORT_CLIENT_WEB




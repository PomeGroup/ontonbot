# Use an official Node runtime as the base image
FROM node:21-alpine AS base

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Stage for local development
FROM base AS local

ARG NEXT_PUBLIC_BACKEND_URL_CLIENT
ARG PORT_CLIENT_WEB
ENV NEXT_PUBLIC_BACKEND_URL_CLIENT=$NEXT_PUBLIC_BACKEND_URL_CLIENT
ENV PORT_CLIENT_WEB=$PORT_CLIENT_WEB
# Expose the port the app runs on
EXPOSE $PORT_CLIENT_WEB
# Command to run the application in development mode
CMD ["npm", "run", "dev"]

# Stage for production build
FROM base AS build
ARG NEXT_PUBLIC_BACKEND_URL_CLIENT
ARG PORT_CLIENT_WEB
ENV NEXT_PUBLIC_BACKEND_URL_CLIENT=$NEXT_PUBLIC_BACKEND_URL_CLIENT
ENV PORT_CLIENT_WEB=$PORT_CLIENT_WEB
RUN npm install
# Build the application
RUN npm run build

# Final stage for production
FROM node:21-alpine AS production
ARG NEXT_PUBLIC_BACKEND_URL_CLIENT
ARG PORT_CLIENT_WEB
ENV NEXT_PUBLIC_BACKEND_URL_CLIENT=$NEXT_PUBLIC_BACKEND_URL_CLIENT
ENV PORT_CLIENT_WEB=$PORT_CLIENT_WEB
# Set the working directory
WORKDIR /usr/src/app

# Copy the production build from the build stage
COPY --from=build /usr/src/app ./

# Install only production dependencies
RUN npm install

# Expose the port the app runs on
EXPOSE $PORT_CLIENT_WEB

# Command to run the application in production mode
CMD npm run start -- -p $PORT_CLIENT_WEB



# frontend/docker-compose.yml

# Use official node image as the base image
FROM node:20-alpine
# or the version you are using

# Set the working directory in docker
WORKDIR /app

# Copy the dependencies file to the working directory
COPY package*.json ./

# Install any dependencies
RUN npm install

# Copy the content of the local src directory to the working directory
COPY . .
#NEXT_PUBLIC_BACKEND_URL_CLIENT
ARG NEXT_PUBLIC_BACKEND_URL_CLIENT
ARG PORT_CLIENT_WEB
ENV NEXT_PUBLIC_BACKEND_URL_CLIENT=$NEXT_PUBLIC_BACKEND_URL_CLIENT
ENV PORT_CLIENT_WEB=$PORT_CLIENT_WEB

# Build the application
RUN npm run build
# Expose the application on port 3000
EXPOSE $PORT_CLIENT_WEB
# Specify the command to run on container start
CMD npm run start -- -p $PORT_CLIENT_WEB

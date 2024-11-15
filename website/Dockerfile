FROM node:21.1.0-alpine3.17 AS base
ARG PORT_WEB_SITE
ARG NEXT_PUBLIC_APP_BASE_URL
ARG MINI_APP_DOMAIN
ENV PORT_WEB_SITE=$PORT_WEB_SITE
ENV NEXT_PUBLIC_APP_BASE_URL=$NEXT_PUBLIC_APP_BASE_URL
ENV MINI_APP_DOMAIN=$MINI_APP_DOMAIN
# Set the working directory inside the container
WORKDIR /app

FROM base AS dependencies
# Copy package.json and package-lock.json
COPY package*.json ./
# Install dependencies
RUN npm install --prod

FROM dependencies AS with-files
# Copy the rest of the application code
COPY . .

FROM with-files AS build
# Build the application
RUN npm run build

FROM build AS production
# Expose the port on which the app runs
EXPOSE $PORT_WEB_SITE
# Start the application
CMD npm run start -- -p $PORT_WEB_SITE

FROM build AS development
# Install all dependencies
RUN npm install
# Expose the port on which the app runs
EXPOSE $PORT_WEB_SITE
# Start the application in development mode
CMD npm run dev -- -p $PORT_WEB_SITE

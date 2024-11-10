# Use an official Node.js image as the base image
FROM node:18-alpine
ARG PORT_WEB_SITE
ARG NEXT_PUBLIC_APP_BASE_URL
ARG MINI_APP_DOMAIN
ENV PORT_WEB_SITE=$PORT_WEB_SITE
ENV NEXT_PUBLIC_APP_BASE_URL=$NEXT_PUBLIC_APP_BASE_URL
ENV MINI_APP_DOMAIN=$MINI_APP_DOMAIN
# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Expose the port on which the app runs
EXPOSE $PORT_WEB_SITE

# Start the application
CMD npm run start -- -p $PORT_WEB_SITE

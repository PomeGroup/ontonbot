# Base image
FROM node:21.1.0-alpine3.17 AS base
# Build arguments to accept environment variables
ARG BOT_TOKEN
ARG ONTON_API_KEY
ARG NEXT_PUBLIC_BOT_USERNAME
ARG NEXT_PUBLIC_API_BASE_URL
ARG NFT_MANAGER_PORT
ARG PARTICIPANT_TMA_PORT
ARG MINI_APP_DOMAIN
ARG MINI_APP_PORT
ARG NODE_TLS_REJECT_UNAUTHORIZED

# Export arguments as environment variables
ENV BOT_TOKEN=${BOT_TOKEN}
ENV ONTON_API_KEY=${ONTON_API_KEY}
ENV NEXT_PUBLIC_BOT_USERNAME=${NEXT_PUBLIC_BOT_USERNAME}
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NFT_MANAGER_PORT=${NFT_MANAGER_PORT}
ENV PARTICIPANT_TMA_PORT=${PARTICIPANT_TMA_PORT}
ENV MINI_APP_DOMAIN=${MINI_APP_DOMAIN}
ENV MINI_APP_PORT=${MINI_APP_PORT}
ENV NODE_TLS_REJECT_UNAUTHORIZED=${NODE_TLS_REJECT_UNAUTHORIZED}
# Install dependencies required for the application
RUN apk update && apk upgrade && \
  apk add --no-cache \
  openssh \
  rsync \
  curl \
  ca-certificates

# Install pnpm globally
WORKDIR /app
RUN echo "Listing contents of /app:" && ls -la /app
COPY ./ /app
RUN echo "Listing contents of /app:" && ls -la /app
RUN npm i -g pnpm
# Set the working directory
# Copy everything from the workspace root to the /app directory inside the container


# Listing contents of /app to verify everything is copied
RUN echo "Listing contents of /app:" && ls -la /app

# Install all dependencies
RUN pnpm install


# Change directory to participant-tma
WORKDIR /app/apps/participant-tma
RUN echo "Listing contents of /app:" && ls -la /app/apps/participant-tma/
RUN echo "Listing ENV" && printenv
# Build the application
RUN pnpm build

# Expose the specified port for participant-tma
ENV PORT=$PARTICIPANT_TMA_PORT
EXPOSE $PORT


CMD pnpm start --port $PARTICIPANT_TMA_PORT

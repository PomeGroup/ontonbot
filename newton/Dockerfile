# Base image
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Build stage
FROM base AS build

# Build arguments to accept environment variables
ARG BOT_TOKEN
ARG ONTON_API_KEY
ARG NEXT_PUBLIC_BOT_USERNAME
ARG NEXT_PUBLIC_API_BASE_URL_ONTON
ARG NEXT_PUBLIC_APP_BASE_URL_ONTON


# Export arguments as environment variables
ENV BOT_TOKEN=${BOT_TOKEN}
ENV ONTON_API_KEY=${ONTON_API_KEY}
ENV NEXT_PUBLIC_BOT_USERNAME=${NEXT_PUBLIC_BOT_USERNAME}
ENV NEXT_PUBLIC_API_BASE_URL_ONTON=${NEXT_PUBLIC_API_BASE_URL_ONTON}
ENV NEXT_PUBLIC_APP_BASE_URL_ONTON=${NEXT_PUBLIC_APP_BASE_URL_ONTON}

# Copy files and install dependencies
COPY . /usr/src/app
WORKDIR /usr/src/app

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install

# Build the application
RUN pnpm run -r build

# Deploy the specific parts
RUN pnpm deploy --filter=nft-manager --prod /prod/nft-manager
RUN pnpm deploy --filter=participant-tma --prod /prod/participant-tma

# Participant-tma runtime stage
FROM base AS participant-tma
COPY --from=build /prod/participant-tma /prod/participant-tma
WORKDIR /prod/participant-tma
EXPOSE 3000

# Start the application
CMD [ "pnpm", "start" ]

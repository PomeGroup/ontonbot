FROM node:22-alpine3.19 AS base
# Install necessary packages
RUN apk update && apk upgrade && \
  apk add \
  bash \
  curl \
  ca-certificates
# Install pnpm globally
RUN npm i -g pnpm
# Set the working directory in the container
WORKDIR /usr/src/app

FROM base AS dependencies
# Copy the package.json and package-lock.json files into the container at /usr/src/app
COPY package*.json ./
# Install any dependencies
RUN pnpm install --prod


FROM dependencies AS with-files
# Copy the rest of your application's code into the container at /usr/src/app
COPY . .

FROM with-files AS production
# Set the command to run your script
CMD [ "pnpm", "start" ]

FROM with-files AS development
# Install all dependencies
RUN pnpm install
# Set the command to run your script
CMD [ "pnpm", "run", "dev:server" ]

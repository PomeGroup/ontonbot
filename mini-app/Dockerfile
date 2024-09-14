# Stage 1: Build Stage
FROM node:20.13.1-alpine3.20 AS builder

# Install pnpm
RUN npm install -g pnpm

# Set the working directory inside the container
WORKDIR /app

# Copy dependencies list
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy the rest of your application source code
COPY . .

# Build TypeScript into JavaScript
RUN pnpm run build-ts

# Build Next.js application
RUN pnpm run build

# Stage 2: Production Stage
FROM node:20.13.1-alpine3.20 AS production

# Install pnpm
RUN npm install -g pnpm

# Set the working directory inside the container
WORKDIR /app

# Copy only the built application and node_modules from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./
COPY --from=builder /app/public ./public

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["pnpm", "run", "start"]

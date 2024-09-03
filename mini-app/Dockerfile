# mini-app/Dockerfile
FROM node:20.13.1-alpine3.20

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

# Expose the port the app runs on
EXPOSE 3000

RUN pnpm run build

# Command to run the application
CMD ["pnpm", "run", "start"]

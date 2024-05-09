# mini-app/Dockerfile
FROM node:latest

# Set the working directory inside the container
WORKDIR /app

# Copy the rest of your application source code
COPY . .

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install

# Expose the port the app runs on
EXPOSE 3000

RUN pnpm run build

# Command to run the application
CMD ["pnpm", "run", "start"]

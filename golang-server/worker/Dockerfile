# Use the official Golang image as a parent image
FROM golang:1.23.3-alpine3.20
# Set the working directory inside the container
WORKDIR /app

# Copy the go.mod and go.sum file into the container
COPY go.mod go.sum ./

# Download all dependencies
RUN go mod download

# Copy the highload package into the container
COPY highload/ ./highload/

COPY ./highload/config.json ./

# Copy the worker's worker.go into the container
COPY worker/worker.go .

RUN go mod tidy

# Build the application
RUN go build -o worker .

# Command to run the executable
 CMD ["./worker"]

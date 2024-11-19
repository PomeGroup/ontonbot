# Use the official Golang image as a parent image
FROM golang:1.23.3-alpine3.20 as full
# Set the working directory inside the container
WORKDIR /app

# Copy the go.mod and go.sum file into the container
COPY go.mod go.sum ./

# Download all dependencies
RUN go mod download

# Copy the highload package into the container
COPY highload/ ./highload/

COPY ./highload/config.json ./

# Copy the server's main.go into the container
COPY server/main.go .

RUN go mod tidy

# Build the application
RUN go build -o server .
FROM full AS development
# Command to run the executable
CMD ["./server"]

FROM full AS production
CMD ["./server"]

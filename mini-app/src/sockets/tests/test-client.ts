import { io } from "socket.io-client";

// Socket configuration
const SOCKET_URL = process.env.SOCKET_URL || "http://localhost:3022"; // Adjust the port if needed
const TEST_INIT_DATA = process.env.TEST_INIT_DATA || ""; // Add your Telegram initData here

// Initialize socket connection
const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  auth: {
    initData: TEST_INIT_DATA, // Pass valid Telegram initData
  },
});

// Handle connection
socket.on("connect", () => {
  console.log("Connected to the server with ID:", socket.id);
  runTests().then(() => console.log("============================")); // Start tests once connected
});

// Handle disconnection
socket.on("disconnect", (reason) => {
  console.log("Disconnected from the server:", reason);
});

// Handle connection errors
socket.on("connect_error", (error) => {
  console.error("Connection error:", error);
});

// Handle notifications
socket.on("notification", (data) => {
  console.log("Received notification:", data);
});

// Function to emit events and test server responses
const runTests = async () => {
  console.log("Starting tests...");
  // Test 1: Emit a test event
  await emitEvent("test-event", { message: "Hello, Socket.IO!" }, "Test 1");
};

// Helper function to emit events
const emitEvent = async (event: string, data: any, testName: string) => {
  return new Promise<void>((resolve) => {
    socket.emit(event, data, (response: any) => {
      console.log(`${testName}: Server response:`, response);
      if (response?.status === "success" || response?.status === "error") {
        console.log(`${testName} passed!`);
      } else {
        console.error(`${testName} failed!`);
      }
      resolve();
    });
  });
};

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down client...");
  socket.close();
  process.exit();
});

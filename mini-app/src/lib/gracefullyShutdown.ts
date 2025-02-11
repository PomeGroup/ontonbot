import { closeDB } from "@/db/db";

process.on("SIGINT", async () => {
  console.log("🛑 Server shutting down...");
  await closeDB();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("⚠️ Received termination signal...");
  await closeDB();
  process.exit(0);
});

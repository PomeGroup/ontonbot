import { createLogger, format, transports } from "winston";

const { combine, timestamp, json } = format;

export const winstonLogger = createLogger({
  level: "debug", // or use process.env.LOG_LEVEL
  // Just do single-line JSON with a timestamp (no transports!)
  format: combine(timestamp(), json()),
  transports: [new transports.Console()],
});

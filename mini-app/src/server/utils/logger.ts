import winston from 'winston';

// Create a logger with colors enabled
const wlg = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.colorize(), // Adds colors based on log level
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(
            ({ level, message, timestamp }) => `${timestamp} [${level}]: ${message}`
        )
    ),
    transports: [new winston.transports.Console()],
});

export default wlg;

// logger.ts
import { winstonLogger } from './winstonLogger';

/** The only two valid log formats in our system. */
export type LogFormatType = 'single_line' | 'multi_line';

/**
 * Read process.env.LOG_FORMAT and cast it to our LogFormatType,
 * defaulting to 'single_line' if it's not 'multi_line'.
 */
const LOG_FORMAT: LogFormatType =
  process.env.LOG_FORMAT === 'multi_line' ? 'multi_line' : 'single_line';

const isSingleLineFormat = LOG_FORMAT === 'single_line';

export const logger = {
  debug: (message?: any, ...meta: any[]) => {
    if (isSingleLineFormat) {
      // Route to Winston (JSON logs)
      (winstonLogger as any).debug(message, ...meta);
    } else {
      // Route to native console.debug
      console.debug(message, ...meta);
    }
  },

  info: (message?: any, ...meta: any[]) => {
    if (isSingleLineFormat) {
      (winstonLogger as any).info(message, ...meta);
    } else {
      console.info(message, ...meta);
    }
  },

  warn: (message?: any, ...meta: any[]) => {
    if (isSingleLineFormat) {
      (winstonLogger as any).warn(message, ...meta);
    } else {
      console.warn(message, ...meta);
    }
  },

  error: (message?: any, ...meta: any[]) => {
    if (isSingleLineFormat) {
      (winstonLogger as any).error(message, ...meta);
    } else {
      console.error(message, ...meta);
    }
  },

  // For a standard "log" call, we default Winston to 'info' level in single-line mode
  log: (message?: any, ...meta: any[]) => {
    if (isSingleLineFormat) {
      (winstonLogger as any).info(message, ...meta);
    } else {
      console.log(message, ...meta);
    }
  },
};

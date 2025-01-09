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

// The helper from step (2):
function replicateArgsAsFields(args: any[]): Record<string, any> {
  const fields: Record<string, any> = {};

  args.forEach((arg, idx) => {
    const key = `logParam_${idx + 1}`;
    if (typeof arg === 'object' && arg !== null) {
      try {
        // Attempt JSON.stringify for objects
        fields[key] = JSON.stringify(arg);
      } catch {
        // Handle circular references
        fields[key] = '[Circular]';
      }
    } else {
      // Convert all non-objects to string
      fields[key] = String(arg);
    }
  });

  return fields;
}


export const logger = {
  debug: (...args: any[]) => {
    if (isSingleLineFormat) {
      // Convert all arguments into { msg1, msg2, ... }
      const fields = replicateArgsAsFields(args);
      // Winston merges these into the log output
      winstonLogger.debug(fields);
    } else {
      console.debug(...args);
    }
  },

  info: (...args: any[]) => {
    if (isSingleLineFormat) {
      const fields = replicateArgsAsFields(args);
      winstonLogger.info(fields);
    } else {
      console.info(...args);
    }
  },

  warn: (...args: any[]) => {
    if (isSingleLineFormat) {
      const fields = replicateArgsAsFields(args);
      winstonLogger.warn(fields);
    } else {
      console.warn(...args);
    }
  },

  error: (...args: any[]) => {
    if (isSingleLineFormat) {
      const fields = replicateArgsAsFields(args);
      winstonLogger.error(fields);
    } else {
      console.error(...args);
    }
  },

  // log(...) will map to 'info' in single-line mode
  log: (...args: any[]) => {
    if (isSingleLineFormat) {
      const fields = replicateArgsAsFields(args);
      winstonLogger.info(fields);
    } else {
      console.log(...args);
    }
  },
};
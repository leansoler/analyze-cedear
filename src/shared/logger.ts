import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Creates and configures a pino logger instance.
 * - In production, it outputs standard JSON for Google Cloud Logging to parse.
 * - In development, it uses 'pino-pretty' for human-readable, colorful output.
 */
const logger = pino({
  level: 'info',
  // Only use pretty printing in development
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
});

export default logger;

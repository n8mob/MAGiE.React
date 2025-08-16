const inDevEnvironment = process.env.NODE_ENV === 'development';
const enableDebugLogging = true;

/**
 * Logs a message to the console if the application is running in a development environment.
 */
export const debug: (...args: unknown[]) => void = (inDevEnvironment && enableDebugLogging)
  ? (...args) => console.debug(...args)
  : () => {};

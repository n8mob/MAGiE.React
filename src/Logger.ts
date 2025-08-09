const inDevEnvironment = process.env.NODE_ENV === 'development';
const enableDebugLogging = false;

export const debug: (...args: unknown[]) => void = (inDevEnvironment && enableDebugLogging)
  ? (...args) => console.debug(...args)
  : () => {};

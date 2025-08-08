const isDev = process.env.NODE_ENV === 'development';

export const debug: (...args: unknown[]) => void = isDev
  ? (...args) => console.debug(...args)
  : () => {};

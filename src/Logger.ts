const isDev = import.meta.env.DEV;

export const debug: (...args: unknown[]) => void = isDev
  ? (...args) => console.debug(...args)
  : () => {};

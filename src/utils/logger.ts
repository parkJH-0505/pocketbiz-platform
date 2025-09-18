/**
 * Conditional logger for development/production environments
 */
export const devLog = {
  log: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log(...args);
    }
  },

  warn: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.warn(...args);
    }
  },

  error: (...args: any[]) => {
    // Always log errors, but with less detail in production
    if (import.meta.env.DEV) {
      console.error(...args);
    } else {
      console.error(args[0]); // Only log the main message in production
    }
  },

  info: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.info(...args);
    }
  },

  debug: (...args: any[]) => {
    if (import.meta.env.DEV && import.meta.env.VITE_DEBUG === 'true') {
      console.log('[DEBUG]', ...args);
    }
  }
};

/**
 * Production-safe console wrapper
 */
export const safeConsole = {
  log: (...args: any[]) => {
    if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_LOGS === 'true') {
      console.log(...args);
    }
  },

  warn: (...args: any[]) => {
    if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_LOGS === 'true') {
      console.warn(...args);
    }
  },

  error: console.error, // Always allow errors

  info: (...args: any[]) => {
    if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_LOGS === 'true') {
      console.info(...args);
    }
  }
};
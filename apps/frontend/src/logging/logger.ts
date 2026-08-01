/**
 * Logging abstraction (D3.15) — development console · production silent.
 * No backend logging · no analytics implementation.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug: (message: string, context?: Record<string, unknown>) => void;
  info: (message: string, context?: Record<string, unknown>) => void;
  warn: (message: string, context?: Record<string, unknown>) => void;
  error: (message: string, context?: Record<string, unknown>) => void;
}

function noop(): void {
  // Production builds stay silent — no console leakage.
}

function createConsoleLogger(): Logger {
  return {
    debug: (message, context) => {
      console.debug(`[gmrlog] ${message}`, context ?? '');
    },
    info: (message, context) => {
      console.info(`[gmrlog] ${message}`, context ?? '');
    },
    warn: (message, context) => {
      console.warn(`[gmrlog] ${message}`, context ?? '');
    },
    error: (message, context) => {
      console.error(`[gmrlog] ${message}`, context ?? '');
    },
  };
}

function createSilentLogger(): Logger {
  return {
    debug: noop,
    info: noop,
    warn: noop,
    error: noop,
  };
}

let activeLogger: Logger | null = null;

/** Resolve logger for current runtime. Production / staging → silent. */
export function createLogger(appEnv: 'development' | 'staging' | 'production'): Logger {
  if (appEnv === 'development') {
    return createConsoleLogger();
  }
  return createSilentLogger();
}

export function setLogger(logger: Logger): void {
  activeLogger = logger;
}

export function getLogger(): Logger {
  if (activeLogger === null) {
    const isDev =
      typeof __DEV__ !== 'undefined'
        ? __DEV__
        : process.env.NODE_ENV !== 'production' && process.env.APP_ENV !== 'production';
    activeLogger = isDev ? createConsoleLogger() : createSilentLogger();
  }
  return activeLogger;
}

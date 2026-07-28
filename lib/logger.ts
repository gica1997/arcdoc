// ============================================
// ArcDoc Enterprise - Professional Logger
// ============================================

import { maskSensitiveData } from './security';

const IS_DEV = process.env.NODE_ENV !== 'production';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMeta {
  [key: string]: unknown;
}

interface ApiErrorContext {
  method?: string;
  path?: string;
  statusCode?: number;
  userId?: string;
  ip?: string;
  [key: string]: unknown;
}

interface DbQueryInfo {
  query: string;
  params?: unknown[];
  duration?: number;
}

const LEVEL_PREFIX: Record<LogLevel, string> = {
  debug: '🔍',
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
};

function formatTimestamp(): string {
  return new Date().toISOString();
}

function truncate(str: string, max = 200): string {
  return str.length > max ? str.substring(0, max) + '...' : str;
}

function sanitizeMeta(meta?: LogMeta): LogMeta | undefined {
  if (!meta) return undefined;
  try {
    return maskSensitiveData(meta as Record<string, unknown>) as LogMeta;
  } catch {
    return { warning: 'failed to sanitize meta' };
  }
}

function log(level: LogLevel, message: string, meta?: LogMeta): void {
  const timestamp = formatTimestamp();
  const safeMeta = sanitizeMeta(meta);

  if (IS_DEV) {
    const color =
      level === 'error' ? '\x1b[31m' :
      level === 'warn'  ? '\x1b[33m' :
      level === 'info'  ? '\x1b[36m' :
                          '\x1b[90m';
    const reset = '\x1b[0m';
    const prefix = LEVEL_PREFIX[level];
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
      `${color}${prefix} [${timestamp}] [${level.toUpperCase()}]${reset}`,
      message,
      safeMeta ? safeMeta : ''
    );
  } else {
    // Production: structured JSON logging
    const entry = {
      timestamp,
      level,
      message,
      ...(safeMeta ? { meta: safeMeta } : {}),
      environment: process.env.VERCEL_ENV || 'production',
    };
    if (level === 'error') {
      console.error(JSON.stringify(entry));
    } else if (level === 'warn') {
      console.warn(JSON.stringify(entry));
    } else {
      console.log(JSON.stringify(entry));
    }
  }
}

export const logger = {
  debug: (message: string, meta?: LogMeta) => log('debug', message, meta),
  info: (message: string, meta?: LogMeta) => log('info', message, meta),
  warn: (message: string, meta?: LogMeta) => log('warn', message, meta),
  error: (message: string, meta?: LogMeta) => log('error', message, meta),

  apiError: (error: unknown, context: ApiErrorContext) => {
    const err = error instanceof Error ? error : new Error(String(error));
    log('error', `API Error: ${err.message}`, {
      ...context,
      errorName: err.name,
      errorStack: IS_DEV ? err.stack : undefined,
    });
  },

  dbQuery: (info: DbQueryInfo) => {
    if (IS_DEV) {
      log('debug', `DB Query (${info.duration || '?'}ms)`, {
        query: truncate(info.query),
        paramsCount: info.params?.length || 0,
      });
    }
  },
};

export default logger;

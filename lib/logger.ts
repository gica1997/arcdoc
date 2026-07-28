// ============================================
// ArcDoc Enterprise - Logger Utility
// ============================================

export function log(...args: unknown[]) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[ArcDoc]', ...args);
  }
}

export function error(...args: unknown[]) {
  console.error('[ArcDoc Error]', ...args);
}

export function warn(...args: unknown[]) {
  console.warn('[ArcDoc Warn]', ...args);
}

const logger = {
  log,
  error,
  warn,
  apiError(error: unknown, context?: Record<string, unknown>) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[API Error]', msg, context ? JSON.stringify(context) : '');
  },
};

export default logger;

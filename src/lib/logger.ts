/**
 * Minimal level-gated logger.
 *
 * This is the browser-side counterpart to a Winston/Pino setup. It deliberately
 * does NOT ship logs anywhere: there is no backend, and log lines here would
 * carry spreadsheet contents — column names, cell values, filenames — which are
 * customer data. See context/system-rules.md §1.
 *
 * If a remote sink is ever added, it becomes a product decision with a
 * data-handling story attached, not a logging change.
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.info('merge.complete', { files: 3, rows: 1200 });
 *
 * Pass counts and identifiers as context, never cell values.
 */

import { env, type LogLevel } from '@/config/env';

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
};

type LogContext = Record<string, unknown>;

const threshold = LEVEL_WEIGHT[env.logLevel];

function enabled(level: Exclude<LogLevel, 'silent'>): boolean {
  return LEVEL_WEIGHT[level] <= threshold;
}

/**
 * Guard against accidentally logging row data. Anything that looks like a bulk
 * payload is replaced with a summary rather than serialised.
 */
function redact(context: LogContext): LogContext {
  const safe: LogContext = {};

  for (const [key, value] of Object.entries(context)) {
    if (Array.isArray(value)) {
      safe[key] = `[Array(${value.length})]`;
    } else if (value instanceof Error) {
      safe[key] = { name: value.name, message: value.message };
    } else if (value !== null && typeof value === 'object') {
      safe[key] = `[Object(${Object.keys(value).length} keys)]`;
    } else {
      safe[key] = value;
    }
  }

  return safe;
}

function emit(
  level: Exclude<LogLevel, 'silent'>,
  method: 'debug' | 'info' | 'warn' | 'error',
  event: string,
  context?: LogContext,
): void {
  if (!enabled(level)) return;

  const prefix = `[${level}] ${event}`;
  if (context && Object.keys(context).length > 0) {
    console[method](prefix, redact(context));
  } else {
    console[method](prefix);
  }
}

export const logger = {
  debug: (event: string, context?: LogContext) => emit('debug', 'debug', event, context),
  info: (event: string, context?: LogContext) => emit('info', 'info', event, context),
  warn: (event: string, context?: LogContext) => emit('warn', 'warn', event, context),
  error: (event: string, context?: LogContext) => emit('error', 'error', event, context),
} as const;

export type Logger = typeof logger;

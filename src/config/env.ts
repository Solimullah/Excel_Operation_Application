/**
 * Typed, validated access to build-time configuration.
 *
 * Every value here is inlined into the client bundle by Vite and is therefore
 * PUBLIC. This module must never read or expose a secret — see
 * context/system-rules.md §5 and the warning in .env.example.
 *
 * Import `env` from here rather than touching `import.meta.env` directly, so
 * parsing, defaulting and validation happen exactly once, at module load.
 */

const LOG_LEVELS = ['silent', 'error', 'warn', 'info', 'debug'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

export class ConfigError extends Error {
  constructor(message: string) {
    super(`[config] ${message}`);
    this.name = 'ConfigError';
  }
}

function readString(key: keyof ImportMetaEnv, fallback: string): string {
  const raw = import.meta.env[key];
  return raw === undefined || raw === '' ? fallback : raw;
}

function readInt(key: keyof ImportMetaEnv, fallback: number): number {
  const raw = import.meta.env[key];
  if (raw === undefined || raw === '') return fallback;

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ConfigError(`${key} must be a positive integer, received "${raw}".`);
  }
  return parsed;
}

function readLogLevel(fallback: LogLevel): LogLevel {
  const raw = import.meta.env.VITE_LOG_LEVEL;
  if (raw === undefined || raw === '') return fallback;

  if (!LOG_LEVELS.includes(raw as LogLevel)) {
    throw new ConfigError(
      `VITE_LOG_LEVEL must be one of ${LOG_LEVELS.join(' | ')}, received "${raw}".`,
    );
  }
  return raw as LogLevel;
}

export const env = {
  appName: readString('VITE_APP_NAME', 'ExcelFile Operations'),
  basePath: readString('VITE_BASE_PATH', '/'),

  previewRowLimit: readInt('VITE_PREVIEW_ROW_LIMIT', 100),
  chartRowLimit: readInt('VITE_CHART_ROW_LIMIT', 20),
  largeFileWarnMb: readInt('VITE_LARGE_FILE_WARN_MB', 25),

  logLevel: readLogLevel(import.meta.env.DEV ? 'debug' : 'error'),

  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const;

export type Env = typeof env;

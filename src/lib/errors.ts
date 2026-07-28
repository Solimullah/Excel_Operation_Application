/**
 * Typed error taxonomy.
 *
 * The counterpart to a backend's error classes. Every failure a user can
 * encounter is one of these, which lets the UI decide what to show without
 * string-matching on messages.
 *
 * `userMessage` is what the interface displays: it must be actionable and must
 * never contain cell values or a full file path.
 */

export type ErrorCode =
  | 'FILE_READ_FAILED'
  | 'FILE_EMPTY'
  | 'UNSUPPORTED_FORMAT'
  | 'SHEET_MISSING'
  | 'COLUMN_MISSING'
  | 'OPERATION_FAILED'
  | 'EXPORT_FAILED'
  | 'CONFIG_INVALID';

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly userMessage: string;
  readonly context: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    userMessage: string,
    options: { cause?: unknown; context?: Record<string, unknown> } = {},
  ) {
    super(`${code}: ${userMessage}`, { cause: options.cause });
    this.name = 'AppError';
    this.code = code;
    this.userMessage = userMessage;
    this.context = options.context ?? {};
  }
}

export class FileReadError extends AppError {
  constructor(fileName: string, cause?: unknown) {
    super('FILE_READ_FAILED', `Could not read "${fileName}". Is it a valid spreadsheet?`, {
      cause,
      context: { fileName },
    });
    this.name = 'FileReadError';
  }
}

export class EmptyFileError extends AppError {
  constructor(fileName: string) {
    super('FILE_EMPTY', `"${fileName}" contains no rows.`, { context: { fileName } });
    this.name = 'EmptyFileError';
  }
}

export class ExportError extends AppError {
  constructor(fileName: string, cause?: unknown) {
    super('EXPORT_FAILED', `Could not export "${fileName}".`, {
      cause,
      context: { fileName },
    });
    this.name = 'ExportError';
  }
}

/**
 * Normalise anything thrown into an AppError, so callers have one shape to
 * handle. Unknown throws become OPERATION_FAILED with a generic message —
 * never surface a raw exception string to the user.
 */
export function toAppError(thrown: unknown, fallbackMessage = 'Something went wrong.'): AppError {
  if (thrown instanceof AppError) return thrown;

  return new AppError('OPERATION_FAILED', fallbackMessage, { cause: thrown });
}

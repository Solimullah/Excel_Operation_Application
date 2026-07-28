/**
 * Application constants that are not environment-dependent.
 *
 * Anything a deployer might reasonably want to change belongs in env.ts.
 */

/** Extensions and MIME types accepted by the file input. */
export const ACCEPTED_FILE_TYPES = '.xlsx,.xls,.csv,.txt,text/csv,text/plain';

export const ACCEPTED_EXTENSIONS = ['xlsx', 'xls', 'csv', 'txt'] as const;

/** Sheet name written into every exported workbook. */
export const EXPORT_SHEET_NAME = 'Sheet1';

/**
 * Suffixes appended to a derived file's stem. An export must never reuse the
 * uploaded file's exact name — see context/system-rules.md §3.
 */
export const FILE_SUFFIX = {
  modified: '_modified',
  processed: '_processed',
  extracted: '_extracted',
  split: '_split',
  part: '_part',
} as const;

/** Characters illegal in filenames on Windows, macOS or Linux. */
export const ILLEGAL_FILENAME_CHARS = /[<>:"/\\|?*]/g;

/** Placeholder used when a split-by-column value is blank. */
export const EMPTY_GROUP_LABEL = 'Empty_Value';

/** Chart series palette, indexed cyclically. */
export const CHART_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'] as const;

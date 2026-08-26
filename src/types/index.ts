export interface ExcelRow {
  [key: string]: any;
}

export interface UploadedFile {
  id: string;
  name: string;
  data: ExcelRow[];
  columns: string[];
}

export enum AppTab {
  UPLOAD = 'UPLOAD',
  VIEW = 'VIEW',
  CLEANING = 'CLEANING',
  COMPARE = 'COMPARE',
  MERGE = 'MERGE',
  FORMULA = 'FORMULA',
  EXTRA_COUNTER = 'EXTRA_COUNTER',
  EXTRA_SPLITTER = 'EXTRA_SPLITTER',
  EXTRA_COMBINER = 'EXTRA_COMBINER',
  EXTRA_EGT_LOGGER = 'EXTRA_EGT_LOGGER',
  EXTRA_SMART_LOOKUP = 'EXTRA_SMART_LOOKUP'
}

export interface ExtraTool {
  tab: AppTab;
  name: string;
  description: string;
  path: string;
}

// Standalone HTML tools served from public/extra-tools and shown in an iframe.
export const EXTRA_TOOLS: ExtraTool[] = [
  { tab: AppTab.EXTRA_COUNTER, name: 'SNTS-Counter', description: 'Count the no of raws ( Sanitas )', path: '/extra-tools/SNTS-Counter.html' },
  { tab: AppTab.EXTRA_SPLITTER, name: 'File Splitter', description: 'Split Large Excel files based on the desired size', path: '/extra-tools/File-Splitter.html' },
  { tab: AppTab.EXTRA_COMBINER, name: 'SNTS-Combiner', description: "Combine files from client's side ( Sanitas )", path: '/extra-tools/SNTS-Combiner.html' },
  { tab: AppTab.EXTRA_EGT_LOGGER, name: 'EGT Control Logger', description: 'Special rules for a task from Spain', path: '/extra-tools/EGT-Control-Logger.html' },
  { tab: AppTab.EXTRA_SMART_LOOKUP, name: 'Smart Lookup', description: "Match rows between two files even when data types don't line up (text vs numbers, dates, formatting)", path: '/extra-tools/smart-lookup-tool.html' },
];

export interface CleaningAction {
  type: 'remove_duplicates' | 'remove_empty' | 'uppercase' | 'lowercase' | 'trim' | 'add_prefix' | 'remove_prefix' | 'extract_column' | 'apply_formula';
  column?: string;
  value?: string;
}

export type ExportFormat = 'xlsx' | 'csv' | 'txt';
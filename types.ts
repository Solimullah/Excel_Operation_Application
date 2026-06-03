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
  VLOOKUP = 'VLOOKUP'
}

export interface CleaningAction {
  type: 'remove_duplicates' | 'remove_empty' | 'uppercase' | 'lowercase' | 'trim' | 'add_prefix' | 'remove_prefix' | 'extract_column' | 'apply_formula';
  column?: string;
  value?: string;
}

export type ExportFormat = 'xlsx' | 'csv' | 'txt';

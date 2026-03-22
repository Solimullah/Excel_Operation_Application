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
  VIEW = 'VIEW'
}

export type ExportFormat = 'xlsx' | 'csv' | 'txt';

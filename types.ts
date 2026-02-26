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
  UPLOAD = 'UPLOAD'
}

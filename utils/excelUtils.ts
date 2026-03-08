import * as XLSX from 'xlsx';
import { ExcelRow } from '../types';

export const readExcelFile = (file: File): Promise<{ data: ExcelRow[], columns: string[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    // Using ArrayBuffer is more robust for detecting formats (especially different Excel versions and CSV encodings)
    reader.readAsArrayBuffer(file);
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Use defval to ensure empty cells don't break column alignment in CSVs
        // raw: false ensures we get the formatted string (e.g. "+1555..." instead of number 1555...)
        const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(sheet, { defval: "", raw: false });
        
        if (jsonData.length === 0) {
            resolve({ data: [], columns: [] });
            return;
        }

        const columns = Object.keys(jsonData[0]);
        resolve({ data: jsonData, columns });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

import type { ExcelRow, UploadedFile } from '@/types';

/**
 * Shared test data.
 *
 * `messyRows` deliberately contains the cases that have historically produced
 * wrong exports. Use it in preference to clean data — see
 * context/agent-rules.md §6.
 */
export const messyRows: ExcelRow[] = [
  // Row 0 defines the column set for the whole file. A key missing here is
  // invisible everywhere downstream (context/system-rules.md §2).
  { id: '001', name: 'Alice', phone: '+15551234567', city: 'Berlin' },
  { id: '002', name: '  bob  ', phone: '', city: 'München' },
  { id: '003', name: 'CAROL', phone: '+15559876543', city: '' },
  // Duplicate of row 0 — exercises remove_duplicates.
  { id: '001', name: 'Alice', phone: '+15551234567', city: 'Berlin' },
  // Entirely blank — exercises remove_empty.
  { id: '', name: '', phone: '', city: '' },
  // Extra key absent from row 0: must not appear in views or exports.
  { id: '004', name: 'Dan', phone: '000123', city: 'Wien', notes: 'invisible' },
];

export const makeFile = (overrides: Partial<UploadedFile> = {}): UploadedFile => ({
  id: 'file-1',
  name: 'contacts.xlsx',
  data: messyRows,
  columns: ['id', 'name', 'phone', 'city'],
  ...overrides,
});

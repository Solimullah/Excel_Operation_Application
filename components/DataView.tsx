import React, { useState, useEffect } from 'react';
import { UploadedFile, ExportFormat } from '../types';
import { ChevronDown } from 'lucide-react';
import { ExportMenu } from './ExportMenu';

interface DataViewProps {
  files: UploadedFile[];
  onDownload: (fileId: string, format: ExportFormat) => void;
}

export const DataView: React.FC<DataViewProps> = ({ files, onDownload }) => {
  const [selectedFileId, setSelectedFileId] = useState<string>(files[0]?.id || '');

  useEffect(() => {
    if (!files.find(f => f.id === selectedFileId) && files.length > 0) {
        setSelectedFileId(files[0].id);
    }
  }, [files, selectedFileId]);

  const activeFile = files.find(f => f.id === selectedFileId);

  if (!activeFile) {
    return (
      <div className="text-center py-20 text-gray-500">
        No files uploaded. Please go to the File Manager.
      </div>
    );
  }

  // Display only first 100 rows for performance in preview
  const displayData = activeFile.data.slice(0, 100);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        <div className="flex items-center space-x-4">
             <div className="relative">
                <select
                    value={selectedFileId}
                    onChange={(e) => setSelectedFileId(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    {files.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <ChevronDown className="h-4 w-4" />
                </div>
            </div>
        </div>

        <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 mr-2">
                Showing top 100 of {activeFile.data.length} rows
            </span>
            <ExportMenu onExport={(format) => onDownload(activeFile.id, format)} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {activeFile.columns.map((col, idx) => (
                  <th
                    key={idx}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayData.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-gray-50">
                  {activeFile.columns.map((col, colIdx) => (
                    <td
                      key={`${rowIdx}-${colIdx}`}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {row[col]?.toString() || ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

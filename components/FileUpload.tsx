import React, { ChangeEvent } from 'react';
import { UploadCloud, FileSpreadsheet, Trash2, Plus, FileText } from 'lucide-react';
import { UploadedFile } from '../types';
import { Button } from './Button';

interface FileUploadProps {
  files: UploadedFile[];
  onFilesSelect: (files: File[]) => void;
  onRemoveFile: (id: string) => void;
  isLoading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ files, onFilesSelect, onRemoveFile, isLoading }) => {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      onFilesSelect(selectedFiles);
      // Reset value so same file can be selected again
      e.target.value = ''; 
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 space-y-8">
      
      {/* Upload Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <UploadCloud className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Data Files</h2>
        <p className="text-gray-500 mb-8">
          Upload at least 2 files to use the Comparison and Merge features.
          <br />
          Supported formats: <span className="font-mono bg-gray-100 px-1 rounded text-gray-700">.xlsx</span> <span className="font-mono bg-gray-100 px-1 rounded text-gray-700">.xls</span> <span className="font-mono bg-gray-100 px-1 rounded text-gray-700">.csv</span> <span className="font-mono bg-gray-100 px-1 rounded text-gray-700">.txt</span>
        </p>

        <label className={`relative inline-flex items-center justify-center px-8 py-4 font-semibold text-white transition-all duration-200 bg-indigo-600 rounded-full cursor-pointer hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 ${isLoading ? 'opacity-75 cursor-wait' : ''}`}>
          {isLoading ? (
            <span>Processing Files...</span>
          ) : (
            <>
              <Plus className="w-5 h-5 mr-2" />
              <span>Add Files</span>
            </>
          )}
          <input 
            type="file" 
            className="hidden" 
            accept=".xlsx, .xls, .csv, .txt, text/csv, text/plain"
            onChange={handleFileChange}
            disabled={isLoading}
            multiple
          />
        </label>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="font-bold text-gray-900">Uploaded Files ({files.length})</h3>
            </div>
            <ul className="divide-y divide-gray-200">
                {files.map((file) => (
                    <li key={file.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${file.name.endsWith('.csv') || file.name.endsWith('.txt') ? 'bg-blue-100' : 'bg-green-100'}`}>
                                {file.name.endsWith('.csv') || file.name.endsWith('.txt') ? (
                                    <FileText className={`h-5 w-5 ${file.name.endsWith('.csv') || file.name.endsWith('.txt') ? 'text-blue-700' : 'text-green-700'}`} />
                                ) : (
                                    <FileSpreadsheet className="h-5 w-5 text-green-700" />
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                <p className="text-xs text-gray-500">{file.data.length} rows, {file.columns.length} columns</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => onRemoveFile(file.id)}>
                            <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                        </Button>
                    </li>
                ))}
            </ul>
        </div>
      )}
    </div>
  );
};

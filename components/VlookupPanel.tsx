import React, { useState, useMemo } from 'react';
import { UploadedFile, ExcelRow } from '../types';
import { Button } from './Button';
import { Search, ArrowRight, Table, Check, AlertCircle, FileSpreadsheet, Plus, X } from 'lucide-react';

interface VlookupPanelProps {
  files: UploadedFile[];
  onUpdateFile: (fileId: string, newData: ExcelRow[]) => void;
}

export const VlookupPanel: React.FC<VlookupPanelProps> = ({ files, onUpdateFile }) => {
  const [sourceFileId, setSourceFileId] = useState<string>('');
  const [lookupFileId, setLookupFileId] = useState<string>('');
  const [sourceKey, setSourceKey] = useState<string>('');
  const [lookupKey, setLookupKey] = useState<string>('');
  const [selectedLookupColumns, setSelectedLookupColumns] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const sourceFile = useMemo(() => files.find(f => f.id === sourceFileId), [files, sourceFileId]);
  const lookupFile = useMemo(() => files.find(f => f.id === lookupFileId), [files, lookupFileId]);

  const handlePerformVlookup = () => {
    if (!sourceFile || !lookupFile || !sourceKey || !lookupKey || selectedLookupColumns.length === 0) return;

    setIsProcessing(true);
    setSuccessMessage(null);

    // Simulate a bit of processing time for UX
    setTimeout(() => {
      try {
        // Create a lookup map for efficiency
        const lookupMap = new Map<any, ExcelRow>();
        lookupFile.data.forEach(row => {
          const keyVal = row[lookupKey];
          if (keyVal !== undefined && keyVal !== null) {
            lookupMap.set(String(keyVal), row);
          }
        });

        // Update source data
        const newData = sourceFile.data.map(row => {
          const sourceVal = row[sourceKey];
          const match = sourceVal !== undefined && sourceVal !== null ? lookupMap.get(String(sourceVal)) : null;
          
          const newRow = { ...row };
          selectedLookupColumns.forEach(col => {
            // If column already exists in source, we might want to prefix it or overwrite it.
            // For simplicity, let's prefix if it exists.
            const targetColName = row[col] !== undefined ? `Lookup_${col}` : col;
            newRow[targetColName] = match ? match[col] : '';
          });
          
          return newRow;
        });

        onUpdateFile(sourceFileId, newData);
        setSuccessMessage(`Successfully added ${selectedLookupColumns.length} columns to ${sourceFile.name}`);
        
        // Reset selections
        setSourceKey('');
        setLookupKey('');
        setSelectedLookupColumns([]);
      } catch (error) {
        console.error("VLOOKUP Error:", error);
        alert("An error occurred during VLOOKUP. Please check your column selections.");
      } finally {
        setIsProcessing(false);
      }
    }, 800);
  };

  const toggleLookupColumn = (col: string) => {
    setSelectedLookupColumns(prev => 
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  if (files.length < 2) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-200 max-w-2xl mx-auto">
        <Search className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900">VLOOKUP AI Workspace</h3>
        <p className="text-gray-500 mt-2 px-6">
          You need at least two files in the File Manager to perform a VLOOKUP operation.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center justify-between animate-fade-in">
          <div className="flex items-center">
            <Check className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-green-500 hover:text-green-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step 1: Select Files */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
            <span className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[10px] mr-2">1</span>
            Select Data Sources
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Source File (Target)</label>
              <select 
                value={sourceFileId}
                onChange={(e) => {
                  setSourceFileId(e.target.value);
                  setSourceKey('');
                }}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">Select source file...</option>
                {files.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <p className="mt-1 text-[10px] text-gray-400 italic">This file will be updated with new columns.</p>
            </div>

            <div className="flex justify-center py-1">
              <ArrowRight className="h-4 w-4 text-gray-300 rotate-90 lg:rotate-0" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Lookup File (Reference)</label>
              <select 
                value={lookupFileId}
                onChange={(e) => {
                  setLookupFileId(e.target.value);
                  setLookupKey('');
                  setSelectedLookupColumns([]);
                }}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">Select lookup file...</option>
                {files.filter(f => f.id !== sourceFileId).map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <p className="mt-1 text-[10px] text-gray-400 italic">Data will be pulled from this file.</p>
            </div>
          </div>
        </div>

        {/* Step 2: Map Columns */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
            <span className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[10px] mr-2">2</span>
            Map Key Columns
          </h3>

          {!sourceFile || !lookupFile ? (
            <div className="h-40 flex flex-col items-center justify-center text-gray-400 border border-dashed border-gray-200 rounded-lg">
              <Table className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-xs">Select both files to map columns</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Match Column in {sourceFile.name}</label>
                <select 
                  value={sourceKey}
                  onChange={(e) => setSourceKey(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Select key column...</option>
                  {sourceFile.columns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-center py-1">
                <Check className="h-4 w-4 text-green-400" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Match Column in {lookupFile.name}</label>
                <select 
                  value={lookupKey}
                  onChange={(e) => setLookupKey(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Select key column...</option>
                  {lookupFile.columns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step 3: Select Columns to Pull */}
      {sourceFile && lookupFile && sourceKey && lookupKey && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center">
              <span className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[10px] mr-2">3</span>
              Choose Columns to Import
            </h3>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
              {selectedLookupColumns.length} Columns Selected
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
            {lookupFile.columns.filter(c => c !== lookupKey).map(col => {
              const isSelected = selectedLookupColumns.includes(col);
              return (
                <button
                  key={col}
                  onClick={() => toggleLookupColumn(col)}
                  className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                    isSelected 
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-1 ring-indigo-200' 
                      : 'bg-white border-gray-100 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="text-xs font-medium truncate mr-2">{col}</span>
                  {isSelected ? (
                    <Check className="h-3.5 w-3.5 flex-shrink-0" />
                  ) : (
                    <Plus className="h-3.5 w-3.5 flex-shrink-0 text-gray-300" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col items-center border-t border-gray-100 pt-8">
            <div className="flex items-center text-xs text-gray-400 mb-4">
              <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
              VLOOKUP will perform an exact match on the key columns.
            </div>
            <Button 
              onClick={handlePerformVlookup}
              disabled={selectedLookupColumns.length === 0 || isProcessing}
              className="px-12 py-4 rounded-xl shadow-lg shadow-indigo-100"
              isLoading={isProcessing}
            >
              <Search className="h-5 w-5 mr-2" />
              Execute VLOOKUP AI
            </Button>
          </div>
        </div>
      )}

      {/* Preview Section */}
      {sourceFile && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 flex items-center">
              <FileSpreadsheet className="h-4 w-4 mr-2 text-indigo-600" />
              Preview: {sourceFile.name}
            </h3>
            <span className="text-[10px] text-gray-400">{sourceFile.data.length} total rows</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white">
                  {sourceFile.columns.slice(0, 6).map(col => (
                    <th key={col} className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                      {col}
                    </th>
                  ))}
                  {selectedLookupColumns.map(col => (
                    <th key={col} className="px-6 py-3 text-[10px] font-bold text-indigo-500 uppercase tracking-wider border-b border-indigo-50 bg-indigo-50/30">
                      {col} (New)
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sourceFile.data.slice(0, 5).map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    {sourceFile.columns.slice(0, 6).map(col => (
                      <td key={col} className="px-6 py-3 text-xs text-gray-600 border-b border-gray-50 truncate max-w-[150px]">
                        {String(row[col] || '')}
                      </td>
                    ))}
                    {selectedLookupColumns.map(col => (
                      <td key={col} className="px-6 py-3 text-xs text-indigo-400 italic border-b border-indigo-50/50 bg-indigo-50/10">
                        Pending...
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

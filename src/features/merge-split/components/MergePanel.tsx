import React, { useState } from 'react';
import { UploadedFile, ExcelRow } from '@/types';
import { Button } from '@/components/ui/Button';
import { Combine, CheckSquare, Square, FileSpreadsheet, MoreVertical, Layers, ArrowDown, TableProperties, SplitSquareHorizontal } from 'lucide-react';
import { downloadExcelFile } from '@/lib/excel';
import { ExportMenu } from '@/components/ui/ExportMenu';

interface MergePanelProps {
  files: UploadedFile[];
}

interface ProcessedFile {
    id: string;
    name: string;
    data: ExcelRow[];
    columns: string[];
    fileCount: number;
    timestamp: Date;
    type: 'merge' | 'split';
}

export const MergePanel: React.FC<MergePanelProps> = ({ files }) => {
  const [mode, setMode] = useState<'merge' | 'split'>('merge');
  
  // Merge state
  const [selectedMergeFileIds, setSelectedMergeFileIds] = useState<Set<string>>(new Set());
  
  // Split state
  const [selectedSplitFileId, setSelectedSplitFileId] = useState<string>(files[0]?.id || '');
  const [splitMethod, setSplitMethod] = useState<'column' | 'row' | 'percentage'>('column');
  const [splitColumn, setSplitColumn] = useState<string>('');
  const [rowsPerFile, setRowsPerFile] = useState<number>(100);
  const [splitPercentage, setSplitPercentage] = useState<number>(50);
  const [splitPercentageTarget, setSplitPercentageTarget] = useState<'rows' | 'columns'>('rows');

  const [results, setResults] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  React.useEffect(() => {
    if (!files.find(f => f.id === selectedSplitFileId) && files.length > 0) {
        setSelectedSplitFileId(files[0].id);
    }
  }, [files, selectedSplitFileId]);

  const activeSplitFile = files.find(f => f.id === selectedSplitFileId);

  React.useEffect(() => {
    if (activeSplitFile && activeSplitFile.columns.length > 0 && !activeSplitFile.columns.includes(splitColumn)) {
        setSplitColumn(activeSplitFile.columns[0]);
    }
  }, [activeSplitFile, splitColumn]);

  const toggleMergeFile = (id: string) => {
    const next = new Set(selectedMergeFileIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedMergeFileIds(next);
  };

  const handleMerge = () => {
    if (selectedMergeFileIds.size < 2) return;
    setIsProcessing(true);

    const selectedFiles = files.filter(f => selectedMergeFileIds.has(f.id));
    
    const allUniqueColumns = new Set<string>();
    selectedFiles.forEach(file => {
        file.columns.forEach(col => {
            if (col && col.trim() !== "") {
                allUniqueColumns.add(col);
            }
        });
    });

    const masterHeaders = Array.from(allUniqueColumns);

    let combinedNormalizedData: ExcelRow[] = [];

    selectedFiles.forEach(file => {
        const normalizedFileRows = file.data.map(row => {
            const normalizedRow: ExcelRow = {};
            masterHeaders.forEach(header => {
                normalizedRow[header] = row[header] !== undefined && row[header] !== null ? row[header] : "";
            });
            return normalizedRow;
        });
        combinedNormalizedData = [...combinedNormalizedData, ...normalizedFileRows];
    });

    const result: ProcessedFile = {
        id: crypto.randomUUID(),
        name: `Merged_${selectedFiles.length}_Files_${new Date().toLocaleDateString().replace(/\//g, '-')}`,
        data: combinedNormalizedData,
        columns: masterHeaders,
        fileCount: selectedFiles.length,
        timestamp: new Date(),
        type: 'merge'
    };

    setResults(prev => [result, ...prev]);
    setIsProcessing(false);
    setSelectedMergeFileIds(new Set());
  };

  const handleSplit = () => {
    if (!activeSplitFile) return;
    setIsProcessing(true);

    if (splitMethod === 'column') {
        if (!splitColumn) {
            setIsProcessing(false);
            return;
        }
        
        // Group rows by the distinct values in splitColumn
        const groups: Record<string, ExcelRow[]> = {};
        
        activeSplitFile.data.forEach(row => {
            const rawVal = row[splitColumn];
            const val = rawVal !== undefined && rawVal !== null && rawVal !== '' ? String(rawVal) : 'Empty_Value';
            
            // Remove characters that are illegal in file names
            const safeVal = val.replace(/[<>:"/\\|?*]/g, '_');
            
            if (!groups[safeVal]) {
                groups[safeVal] = [];
            }
            groups[safeVal].push(row);
        });

        const newResults: ProcessedFile[] = Object.entries(groups).map(([val, groupData]) => {
            // Create base filename without extension
            const baseName = activeSplitFile.name.substring(0, activeSplitFile.name.lastIndexOf('.')) || activeSplitFile.name;
            
            return {
                id: crypto.randomUUID(),
                name: `${baseName}_split_${val}`,
                data: groupData,
                columns: activeSplitFile.columns,
                fileCount: 1,
                timestamp: new Date(),
                type: 'split'
            };
        });

        // Add all newly created split files
        setResults(prev => [...newResults, ...prev]);
    } else if (splitMethod === 'row') {
        // Split by rows
        if (rowsPerFile <= 0) {
            setIsProcessing(false);
            return;
        }
        
        const chunks: ExcelRow[][] = [];
        for (let i = 0; i < activeSplitFile.data.length; i += rowsPerFile) {
            chunks.push(activeSplitFile.data.slice(i, i + rowsPerFile));
        }
        
        const newResults: ProcessedFile[] = chunks.map((chunkData, index) => {
            const baseName = activeSplitFile.name.substring(0, activeSplitFile.name.lastIndexOf('.')) || activeSplitFile.name;
            return {
                id: crypto.randomUUID(),
                name: `${baseName}_part_${index + 1}`,
                data: chunkData,
                columns: activeSplitFile.columns,
                fileCount: 1,
                timestamp: new Date(),
                type: 'split'
            };
        });
        setResults(prev => [...newResults, ...prev]);
    } else if (splitMethod === 'percentage') {
        const pct = Math.min(Math.max(splitPercentage, 1), 99);
        const baseName = activeSplitFile.name.substring(0, activeSplitFile.name.lastIndexOf('.')) || activeSplitFile.name;

        if (splitPercentageTarget === 'rows') {
            const splitIndex = Math.floor(activeSplitFile.data.length * (pct / 100));
            const part1 = activeSplitFile.data.slice(0, splitIndex);
            const part2 = activeSplitFile.data.slice(splitIndex);

            const result1: ProcessedFile = {
                id: crypto.randomUUID(),
                name: `${baseName}_part1_${pct}pct_rows`,
                data: part1,
                columns: activeSplitFile.columns,
                fileCount: 1,
                timestamp: new Date(),
                type: 'split'
            };
            const result2: ProcessedFile = {
                id: crypto.randomUUID(),
                name: `${baseName}_part2_${100 - pct}pct_rows`,
                data: part2,
                columns: activeSplitFile.columns,
                fileCount: 1,
                timestamp: new Date(),
                type: 'split'
            };
            setResults(prev => [result1, result2, ...prev]);

        } else if (splitPercentageTarget === 'columns') {
            const colSplitIndex = Math.floor(activeSplitFile.columns.length * (pct / 100));
            const cols1 = activeSplitFile.columns.slice(0, colSplitIndex);
            const cols2 = activeSplitFile.columns.slice(colSplitIndex);

            const data1 = activeSplitFile.data.map(row => {
                const newRow: ExcelRow = {};
                cols1.forEach(c => newRow[c] = row[c]);
                return newRow;
            });
            const data2 = activeSplitFile.data.map(row => {
                const newRow: ExcelRow = {};
                cols2.forEach(c => newRow[c] = row[c]);
                return newRow;
            });

            const result1: ProcessedFile = {
                id: crypto.randomUUID(),
                name: `${baseName}_part1_${pct}pct_cols`,
                data: data1,
                columns: cols1,
                fileCount: 1,
                timestamp: new Date(),
                type: 'split'
            };
            const result2: ProcessedFile = {
                id: crypto.randomUUID(),
                name: `${baseName}_part2_${100 - pct}pct_cols`,
                data: data2,
                columns: cols2,
                fileCount: 1,
                timestamp: new Date(),
                type: 'split'
            };
            setResults(prev => [result1, result2, ...prev]);
        }
    }
    
    setIsProcessing(false);
  };

  if (files.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-200 max-w-2xl mx-auto">
        <Combine className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900">Merge & Split Workspace</h3>
        <p className="text-gray-500 mt-2 px-6">
          Upload files in the File Manager to use the merge or split features.
        </p>
      </div>
    );
  }

  // Calculate union of headers for the current selection to show preview
  const currentSelectionHeaders = new Set<string>();
  files.filter(f => selectedMergeFileIds.has(f.id)).forEach(f => f.columns.forEach(c => currentSelectionHeaders.add(c)));

  return (
    <div className="max-w-6xl mx-auto space-y-8">
        
      {/* Mode Toggle */}
      <div className="flex justify-center mb-8">
          <div className="bg-gray-100 p-1 rounded-xl inline-flex shadow-inner">
              <button 
                  onClick={() => setMode('merge')}
                  className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      mode === 'merge' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                  <Combine className="h-4 w-4 mr-2" />
                  Merge Multiple Files
              </button>
              <button 
                  onClick={() => setMode('split')}
                  className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      mode === 'split' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                  <SplitSquareHorizontal className="h-4 w-4 mr-2" />
                  Split a File
              </button>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Selection Area */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
            
            {mode === 'merge' ? (
                // MERGE UI
                <>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center">
                            <Layers className="h-5 w-5 mr-2 text-indigo-600" />
                            Select Files to Combine
                        </h3>
                        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                            {selectedMergeFileIds.size} Selected
                        </span>
                    </div>

                    <div className="space-y-2 max-h-[350px] overflow-y-auto mb-6 pr-2 custom-scrollbar flex-1">
                        {files.map(file => {
                            const isSelected = selectedMergeFileIds.has(file.id);
                            return (
                                <div 
                                    key={file.id}
                                    onClick={() => toggleMergeFile(file.id)}
                                    className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all ${
                                        isSelected 
                                        ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' 
                                        : 'bg-white border-gray-100 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="mr-4">
                                        {isSelected ? (
                                            <CheckSquare className="h-5 w-5 text-indigo-600" />
                                        ) : (
                                            <Square className="h-5 w-5 text-gray-300" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {file.data.length} rows • {file.columns.length} headers
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {selectedMergeFileIds.size > 0 && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center">
                                <TableProperties className="h-3 w-3 mr-1" />
                                Detected Merge Schema ({currentSelectionHeaders.size} columns)
                            </h4>
                            <div className="flex flex-wrap gap-1">
                                {Array.from(currentSelectionHeaders).slice(0, 10).map(header => (
                                    <span key={header} className="text-[10px] bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded">
                                        {header}
                                    </span>
                                ))}
                                {currentSelectionHeaders.size > 10 && (
                                    <span className="text-[10px] text-gray-400 py-0.5">+{currentSelectionHeaders.size - 10} more...</span>
                                )}
                            </div>
                        </div>
                    )}

                    <Button 
                        onClick={handleMerge} 
                        disabled={selectedMergeFileIds.size < 2 || isProcessing}
                        className="w-full py-4 rounded-xl shadow-md shadow-indigo-100"
                        isLoading={isProcessing && mode === 'merge'}
                    >
                        <Combine className="h-5 w-5 mr-2" />
                        Merge {selectedMergeFileIds.size} Files
                    </Button>
                </>
            ) : (
                // SPLIT UI
                <>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center">
                            <SplitSquareHorizontal className="h-5 w-5 mr-2 text-indigo-600" />
                            Split Dataset
                        </h3>
                    </div>

                    <div className="space-y-6 flex-1">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">1. Select File to Split</label>
                            <select 
                                value={selectedSplitFileId}
                                onChange={(e) => setSelectedSplitFileId(e.target.value)}
                                className="block w-full rounded-md border-gray-300 border p-3 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm"
                            >
                                {files.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                        </div>
                        
                        {activeSplitFile && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">2. Split Method</label>
                                    <div className="flex items-center space-x-4">
                                        <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                                            <input 
                                                type="radio" 
                                                checked={splitMethod === 'column'} 
                                                onChange={() => setSplitMethod('column')}
                                            />
                                            <span>By Unique Column Value</span>
                                        </label>
                                        <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                                            <input 
                                                type="radio" 
                                                checked={splitMethod === 'row'} 
                                                onChange={() => setSplitMethod('row')}
                                            />
                                            <span>By Row Count</span>
                                        </label>
                                        <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                                            <input 
                                                type="radio" 
                                                checked={splitMethod === 'percentage'} 
                                                onChange={() => setSplitMethod('percentage')}
                                            />
                                            <span>By Percentage</span>
                                        </label>
                                    </div>
                                </div>

                                {splitMethod === 'column' ? (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">3. Target Column to Split By</label>
                                        <p className="text-xs text-gray-500 mb-2">The file will be separated into new files for every unique value found in this column.</p>
                                        <select 
                                            value={splitColumn}
                                            onChange={(e) => setSplitColumn(e.target.value)}
                                            className="block w-full rounded-md border-gray-300 border p-3 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm"
                                        >
                                            {activeSplitFile.columns.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                ) : splitMethod === 'percentage' ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">3. Split Target</label>
                                            <div className="flex items-center space-x-4">
                                                <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                                                    <input 
                                                        type="radio" 
                                                        checked={splitPercentageTarget === 'rows'} 
                                                        onChange={() => setSplitPercentageTarget('rows')}
                                                    />
                                                    <span>Rows</span>
                                                </label>
                                                <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                                                    <input 
                                                        type="radio" 
                                                        checked={splitPercentageTarget === 'columns'} 
                                                        onChange={() => setSplitPercentageTarget('columns')}
                                                    />
                                                    <span>Columns</span>
                                                </label>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">4. Percentage for first file (1-99)</label>
                                            <p className="text-xs text-gray-500 mb-2">The dataset will be split into two files based on this percentage (e.g., {splitPercentage}% and {100 - splitPercentage}%).</p>
                                            <input 
                                                type="number"
                                                value={splitPercentage}
                                                min={1}
                                                max={99}
                                                onChange={(e) => setSplitPercentage(parseInt(e.target.value) || 50)}
                                                className="block w-full rounded-md border-gray-300 border p-3 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm"
                                            />
                                            <div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100 flex flex-col shadow-inner">
                                                <span className="text-indigo-800 text-sm mb-1">
                                                    <strong>File 1:</strong> {splitPercentage}% 
                                                    ({splitPercentageTarget === 'rows' 
                                                        ? Math.floor(activeSplitFile.data.length * (splitPercentage / 100)) + ' rows' 
                                                        : Math.floor(activeSplitFile.columns.length * (splitPercentage / 100)) + ' columns'})
                                                </span>
                                                <span className="text-indigo-800 text-sm">
                                                    <strong>File 2:</strong> {100 - splitPercentage}% 
                                                    ({splitPercentageTarget === 'rows' 
                                                        ? activeSplitFile.data.length - Math.floor(activeSplitFile.data.length * (splitPercentage / 100)) + ' rows' 
                                                        : activeSplitFile.columns.length - Math.floor(activeSplitFile.columns.length * (splitPercentage / 100)) + ' columns'})
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">3. Maximum Rows per File</label>
                                        <p className="text-xs text-gray-500 mb-2">The file will be chunked into parts containing up to this number of rows.</p>
                                        <input 
                                            type="number"
                                            value={rowsPerFile}
                                            min={1}
                                            onChange={(e) => setRowsPerFile(parseInt(e.target.value) || 1)}
                                            className="block w-full rounded-md border-gray-300 border p-3 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm"
                                        />
                                        {rowsPerFile > 0 && activeSplitFile.data.length > 0 && (
                                            <div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100 flex items-center shadow-inner">
                                                <span className="text-indigo-800 text-sm">
                                                    This will generate <strong>{Math.ceil(activeSplitFile.data.length / rowsPerFile)}</strong> new file(s) from {activeSplitFile.data.length} total rows.
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                        
                        <div className="p-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-100 text-xs shadow-inner mt-auto">
                            <strong>Tip:</strong> Splitting a large dataset automatically creates separate files that retain your original column headers. This is great for slicing regional reports or handling large batches!
                        </div>
                    </div>

                    <Button 
                        onClick={handleSplit} 
                        variant="primary"
                        disabled={!activeSplitFile || (splitMethod === 'column' && !splitColumn) || (splitMethod === 'row' && rowsPerFile <= 0) || (splitMethod === 'percentage' && (splitPercentage < 1 || splitPercentage > 99)) || isProcessing}
                        className="w-full py-4 rounded-xl shadow-md shadow-indigo-100 mt-6"
                        isLoading={isProcessing && mode === 'split'}
                    >
                        <SplitSquareHorizontal className="h-5 w-5 mr-2" />
                        Split Dataset Now
                    </Button>
                </>
            )}
        </div>

        {/* Results Staging Area */}
        <div className="space-y-4 flex flex-col h-full">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                    <ArrowDown className="h-5 w-5 mr-2 text-green-600" />
                    Generations History
                </h3>
                {results.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setResults([])} className="text-gray-400 hover:text-red-500 h-8">
                        Clear Area
                    </Button>
                )}
            </div>
            
            <div className="flex-1 bg-gray-50 rounded-xl border border-dashed border-gray-300 p-4 overflow-y-auto max-h-[600px] custom-scrollbar">
                {results.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center min-h-[300px]">
                        <Combine className="h-10 w-10 mb-2 opacity-20" />
                        <p className="text-sm">Processed files will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {results.map(result => (
                            <div key={result.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-indigo-300 transition-colors animate-fade-in relative group">
                                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${result.type === 'merge' ? 'bg-indigo-500' : 'bg-pink-500'}`}></div>
                                
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3 pl-2 max-w-[85%]">
                                        <div className={`p-2 rounded-lg ${result.type === 'merge' ? 'bg-indigo-100 text-indigo-700' : 'bg-pink-100 text-pink-700'}`}>
                                            {result.type === 'merge' ? <Combine className="h-5 w-5" /> : <SplitSquareHorizontal className="h-5 w-5" />}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-gray-900 text-sm truncate" title={result.name}>
                                                {result.name}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                {result.type === 'merge' ? (
                                                    <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter border border-indigo-100 whitespace-nowrap">
                                                        {result.fileCount} Merged
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] bg-pink-50 text-pink-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter border border-pink-100 whitespace-nowrap">
                                                        Split Segment
                                                    </span>
                                                )}
                                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                                    {result.data.length} rows
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <ExportMenu 
                                        trigger={
                                            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 flex-shrink-0">
                                                <MoreVertical className="h-5 w-5" />
                                            </button>
                                        }
                                        onExport={(format) => downloadExcelFile(result.data, result.name, format)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
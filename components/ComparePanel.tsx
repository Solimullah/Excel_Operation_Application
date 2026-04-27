import React, { useState } from 'react';
import { UploadedFile, ExportFormat } from '../types';
import { Button } from './Button';
import { GitCompare, ArrowRightLeft, AlertCircle } from 'lucide-react';
import { downloadExcelFile } from '../utils/excelUtils';
import { ExportMenu } from './ExportMenu';

interface ComparePanelProps {
  files: UploadedFile[];
}

export const ComparePanel: React.FC<ComparePanelProps> = ({ files }) => {
  const [file1Id, setFile1Id] = useState<string>(files[0]?.id || '');
  const [file2Id, setFile2Id] = useState<string>(files[1]?.id || '');
  const [col1, setCol1] = useState<string>('');
  const [col2, setCol2] = useState<string>('');
  const [result, setResult] = useState<{ in1Only: any[], in2Only: any[], common: any[] } | null>(null);

  const file1 = files.find(f => f.id === file1Id);
  const file2 = files.find(f => f.id === file2Id);

  // Initialize columns when files change
  React.useEffect(() => {
    if (file1 && !col1) setCol1(file1.columns[0] || '');
    if (file2 && !col2) setCol2(file2.columns[0] || '');
  }, [file1, file2, col1, col2]);

  if (files.length < 2) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-200">
        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900">Not Enough Files</h3>
        <p className="text-gray-500">Please upload at least 2 files to use the comparison feature.</p>
      </div>
    );
  }

  const handleCompare = () => {
    if (!file1 || !file2 || !col1 || !col2) return;

    const set1 = new Set(file1.data.map(r => String(r[col1])));
    const set2 = new Set(file2.data.map(r => String(r[col2])));

    const in1Only = file1.data.filter(r => !set2.has(String(r[col1])));
    const in2Only = file2.data.filter(r => !set1.has(String(r[col2])));
    
    // For common, we just take rows from file1 that are also in file2
    const common = file1.data.filter(r => set2.has(String(r[col1])));

    setResult({ in1Only, in2Only, common });
  };

  const downloadResult = (data: any[], type: string, format: ExportFormat) => {
    if (data.length === 0) return;
    downloadExcelFile(data, `comparison_${type}.${format}`, format);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center mb-6 text-gray-900">
            <GitCompare className="h-6 w-6 text-indigo-600 mr-2" />
            <h2 className="text-2xl font-bold">Compare Files</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
           {/* Connector Icon */}
           <div className="hidden md:flex absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-100 p-2 rounded-full border border-gray-200 z-10">
                <ArrowRightLeft className="h-5 w-5 text-gray-500" />
           </div>

           {/* Source 1 */}
           <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h3 className="font-semibold text-gray-700 mb-4">Source File A</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-500 mb-1">Select File</label>
                        <select 
                            value={file1Id} 
                            onChange={(e) => setFile1Id(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                        >
                            {files.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-500 mb-1">Compare Column</label>
                         <select 
                            value={col1} 
                            onChange={(e) => setCol1(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                        >
                            {file1?.columns.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
           </div>

           {/* Source 2 */}
           <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h3 className="font-semibold text-gray-700 mb-4">Source File B</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-500 mb-1">Select File</label>
                        <select 
                            value={file2Id} 
                            onChange={(e) => setFile2Id(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                        >
                            {files.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                    </div>
                    <div>
                         <label className="block text-sm text-gray-500 mb-1">Compare Column</label>
                         <select 
                            value={col2} 
                            onChange={(e) => setCol2(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                        >
                            {file2?.columns.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
           </div>
        </div>

        <div className="mt-8 flex justify-center">
            <Button size="lg" onClick={handleCompare} disabled={!file1 || !file2}>
                Compare Data
            </Button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h4 className="font-bold text-lg text-red-600 mb-2">Unique to {file1?.name}</h4>
                <div className="text-3xl font-bold text-gray-900 mb-4">{result.in1Only.length} <span className="text-sm font-normal text-gray-500">rows</span></div>
                <ExportMenu 
                    label="Download" 
                    size="sm" 
                    onExport={(format) => downloadResult(result.in1Only, 'unique_to_A', format)} 
                />
            </div>
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h4 className="font-bold text-lg text-green-600 mb-2">Common Rows</h4>
                <div className="text-3xl font-bold text-gray-900 mb-4">{result.common.length} <span className="text-sm font-normal text-gray-500">rows</span></div>
                <ExportMenu 
                    label="Download" 
                    size="sm" 
                    onExport={(format) => downloadResult(result.common, 'common', format)} 
                />
            </div>
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h4 className="font-bold text-lg text-blue-600 mb-2">Unique to {file2?.name}</h4>
                <div className="text-3xl font-bold text-gray-900 mb-4">{result.in2Only.length} <span className="text-sm font-normal text-gray-500">rows</span></div>
                 <ExportMenu 
                    label="Download" 
                    size="sm" 
                    onExport={(format) => downloadResult(result.in2Only, 'unique_to_B', format)} 
                />
            </div>
        </div>
      )}
    </div>
  );
};

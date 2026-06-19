import React, { useState, useEffect } from 'react';
import { UploadedFile } from '../types';
import { Sparkles, Hash, Type, Calendar, ChevronDown } from 'lucide-react';

interface AnalysisPanelProps {
  files: UploadedFile[];
}

interface ColumnStats {
  name: string;
  type: 'number' | 'string' | 'date' | 'boolean' | 'unknown';
  nullCount: number;
  distinctCount: number;
  min?: number;
  max?: number;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ files }) => {
  const [selectedFileId, setSelectedFileId] = useState<string>(files[0]?.id || '');
  const [stats, setStats] = useState<ColumnStats[]>([]);

  useEffect(() => {
    if (!files.find(f => f.id === selectedFileId) && files.length > 0) {
        setSelectedFileId(files[0].id);
    }
  }, [files, selectedFileId]);

  const activeFile = files.find(f => f.id === selectedFileId);

  useEffect(() => {
    if (!activeFile) return;
    
    // Calculate local statistics
    const newStats: ColumnStats[] = activeFile.columns.map(col => {
      let nullCount = 0;
      const values = new Set();
      let isNumber = true;
      let isDate = true;
      let min = Infinity;
      let max = -Infinity;

      activeFile.data.forEach(row => {
        const val = row[col];
        if (val === null || val === undefined || val === '') {
          nullCount++;
        } else {
          values.add(val);
          // Check type
          if (isNaN(Number(val))) {
              isNumber = false;
          } else {
              const num = Number(val);
              if (num < min) min = num;
              if (num > max) max = num;
          }
          if (isNaN(Date.parse(String(val)))) isDate = false;
        }
      });

      let type: ColumnStats['type'] = 'string';
      if (isNumber && values.size > 0) type = 'number';
      else if (isDate && values.size > 0) type = 'date';

      return {
        name: col,
        type,
        nullCount,
        distinctCount: values.size,
        min: min === Infinity ? undefined : min,
        max: max === -Infinity ? undefined : max
      };
    });

    setStats(newStats);
  }, [activeFile]);

  if (!activeFile) return <div className="text-center py-10">No files available.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* File Selector */}
      <div className="flex justify-end">
         <div className="relative w-64">
            <select
                value={selectedFileId}
                onChange={(e) => setSelectedFileId(e.target.value)}
                className="appearance-none w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-start space-x-4">
            <div className="p-3 bg-white/20 rounded-lg">
                <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
                <h2 className="text-2xl font-bold mb-2">Local Data Profiler: {activeFile.name}</h2>
                <p className="text-blue-100 max-w-2xl">
                   Instant, privacy-first data analysis. All statistics are calculated locally in your browser.
                </p>
                <div className="mt-4 flex gap-4 text-sm font-medium">
                    <div className="bg-black/10 px-3 py-1.5 rounded-md">Rows: {activeFile.data.length}</div>
                    <div className="bg-black/10 px-3 py-1.5 rounded-md">Columns: {activeFile.columns.length}</div>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map(stat => (
              <div key={stat.name} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900 truncate" title={stat.name}>{stat.name}</h3>
                      <div className="text-gray-400">
                          {stat.type === 'number' ? <Hash className="h-5 w-5" /> : 
                           stat.type === 'date' ? <Calendar className="h-5 w-5" /> : 
                           <Type className="h-5 w-5" />}
                      </div>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                          <span className="text-gray-500">Data Type</span>
                          <span className="font-medium text-gray-900 capitalize px-2 py-0.5 bg-gray-100 rounded text-xs">{stat.type}</span>
                      </div>
                      <div className="flex justify-between">
                          <span className="text-gray-500">Distinct Values</span>
                          <span className="font-medium text-gray-900">{stat.distinctCount}</span>
                      </div>
                      <div className="flex justify-between">
                          <span className="text-gray-500">Missing (Null)</span>
                          <span className={`font-medium ${stat.nullCount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                              {stat.nullCount} ({(stat.nullCount / activeFile.data.length * 100).toFixed(1)}%)
                          </span>
                      </div>
                      {stat.type === 'number' && stat.min !== undefined && stat.max !== undefined && (
                          <div className="pt-2 mt-2 border-t border-gray-100">
                             <div className="flex justify-between text-xs">
                                 <span className="text-gray-500">Min: <span className="text-gray-900 font-medium">{stat.min}</span></span>
                                 <span className="text-gray-500">Max: <span className="text-gray-900 font-medium">{stat.max}</span></span>
                             </div>
                          </div>
                      )}
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
};

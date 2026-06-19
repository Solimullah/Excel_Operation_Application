import React, { useState, useEffect } from 'react';
import { UploadedFile } from '../types';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { ChevronDown } from 'lucide-react';

interface ChartPanelProps {
  files: UploadedFile[];
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export const ChartPanel: React.FC<ChartPanelProps> = ({ files }) => {
  const [selectedFileId, setSelectedFileId] = useState<string>(files[0]?.id || '');
  const [xAxis, setXAxis] = useState<string>('');
  const [yAxis, setYAxis] = useState<string>('');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');

  useEffect(() => {
    if (!files.find(f => f.id === selectedFileId) && files.length > 0) {
        setSelectedFileId(files[0].id);
    }
  }, [files, selectedFileId]);

  const activeFile = files.find(f => f.id === selectedFileId);

  useEffect(() => {
      if (activeFile) {
        if (!activeFile.columns.includes(xAxis)) setXAxis(activeFile.columns[0] || '');
        if (!activeFile.columns.includes(yAxis)) setYAxis(activeFile.columns[1] || activeFile.columns[0] || '');
      }
  }, [activeFile, xAxis, yAxis]);

  if (!activeFile) return <div className="text-center py-10">No files available.</div>;

  // Prepare data (limit to top 20 for readability in charts)
  const chartData = activeFile.data.slice(0, 20).map(row => ({
    ...row,
    [yAxis]: Number(row[yAxis]) || 0 // Ensure numerical value
  }));

  return (
    <div className="space-y-6">
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

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">X Axis (Category)</label>
            <select
              value={xAxis}
              onChange={(e) => setXAxis(e.target.value)}
              className="block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              {activeFile.columns.map(col => <option key={col} value={col}>{col}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Y Axis (Value)</label>
            <select
              value={yAxis}
              onChange={(e) => setYAxis(e.target.value)}
              className="block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              {activeFile.columns.map(col => <option key={col} value={col}>{col}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chart Type</label>
             <div className="flex rounded-md shadow-sm" role="group">
                <button
                    type="button"
                    onClick={() => setChartType('bar')}
                    className={`px-4 py-2 text-sm font-medium border border-gray-300 rounded-l-lg hover:bg-gray-100 ${chartType === 'bar' ? 'bg-indigo-50 text-indigo-700 z-10 border-indigo-500' : 'bg-white text-gray-700'}`}
                >
                    Bar
                </button>
                <button
                    type="button"
                    onClick={() => setChartType('line')}
                    className={`px-4 py-2 text-sm font-medium border-t border-b border-gray-300 hover:bg-gray-100 ${chartType === 'line' ? 'bg-indigo-50 text-indigo-700 z-10 border-indigo-500' : 'bg-white text-gray-700'}`}
                >
                    Line
                </button>
                <button
                    type="button"
                    onClick={() => setChartType('pie')}
                    className={`px-4 py-2 text-sm font-medium border border-gray-300 rounded-r-lg hover:bg-gray-100 ${chartType === 'pie' ? 'bg-indigo-50 text-indigo-700 z-10 border-indigo-500' : 'bg-white text-gray-700'}`}
                >
                    Pie
                </button>
            </div>
          </div>
        </div>

        <div className="h-[400px] w-full bg-gray-50 rounded-lg p-4 border border-gray-100 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' ? (
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey={xAxis} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey={yAxis} fill="#4F46E5" />
                    </BarChart>
                ) : chartType === 'line' ? (
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey={xAxis} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey={yAxis} stroke="#4F46E5" activeDot={{ r: 8 }} />
                    </LineChart>
                ) : (
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey={yAxis}
                            nameKey={xAxis}
                        >
                             {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                )}
            </ResponsiveContainer>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">Displaying first 20 records</p>
      </div>
    </div>
  );
};

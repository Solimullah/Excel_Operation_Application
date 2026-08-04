import React, { useState, useEffect } from 'react';
import { UploadedFile } from '@/types';
import { Button } from '@/components/ui/Button';
import { Copy, Check, Calculator, ChevronDown, ArrowRightCircle } from 'lucide-react';

interface FormulaPanelProps {
  files: UploadedFile[];
  onAddToPipeline?: (fileId: string, formula: string, targetColumn: string) => void;
}

const TEMPLATES = [
  { id: 'sum', name: 'SUM', template: '=SUM({col1})', desc: 'Adds all numbers in a range.' },
  { id: 'average', name: 'AVERAGE', template: '=AVERAGE({col1})', desc: 'Calculates the average of numbers.' },
  { id: 'concatenate', name: 'CONCATENATE', template: '=CONCATENATE({col1}, " ", {col2})', desc: 'Joins two strings together.' },
  { id: 'if', name: 'IF Statement', template: '=IF({col1}="Value", "Yes", "No")', desc: 'Basic conditional logic.' },
  { id: 'vlookup', name: 'VLOOKUP', template: '=VLOOKUP({col1}, A:B, 2, FALSE)', desc: 'Looks up a value in another column.' }
];

export const FormulaPanel: React.FC<FormulaPanelProps> = ({ files, onAddToPipeline }) => {
  const [selectedFileId, setSelectedFileId] = useState<string>(files[0]?.id || '');
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [col1, setCol1] = useState('');
  const [col2, setCol2] = useState('');
  const [formula, setFormula] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [targetColumnName, setTargetColumnName] = useState('New_Formula_Col');

  useEffect(() => {
    if (!files.find(f => f.id === selectedFileId) && files.length > 0) {
        setSelectedFileId(files[0].id);
    }
  }, [files, selectedFileId]);

  const activeFile = files.find(f => f.id === selectedFileId);

  useEffect(() => {
      if (activeFile && activeFile.columns.length > 0) {
          if (!activeFile.columns.includes(col1)) setCol1(activeFile.columns[0]);
          if (!activeFile.columns.includes(col2)) setCol2(activeFile.columns[0]);
      }
  }, [activeFile, col1, col2]);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFile) return;

    let generated = selectedTemplate.template;
    // Replace placeholders with generic excel column references or just column names
    generated = generated.replace('{col1}', col1);
    generated = generated.replace('{col2}', col2);

    setFormula(generated);
    setCopied(false);
  };

  const copyToClipboard = () => {
    if (formula) {
      navigator.clipboard.writeText(formula);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendToPipeline = () => {
    if (onAddToPipeline && formula && activeFile) {
        onAddToPipeline(activeFile.id, formula, targetColumnName);
    }
  };

  if (!activeFile) return <div className="text-center py-10">No files available.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
           <div className="flex items-center">
             <Calculator className="h-5 w-5 text-indigo-600 mr-2" />
             <h3 className="font-bold text-gray-900">Formula Templates</h3>
           </div>
           <div className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">Local Builder</div>
        </div>
        
        <div className="p-6 space-y-6">
            <div>
                <p className="text-sm text-gray-600 mb-4">
                    Select a common formula pattern and map it to your columns in <strong>{activeFile.name}</strong>.
                </p>
                <form onSubmit={handleGenerate} className="space-y-4">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Template</label>
                            <select 
                                value={selectedTemplate.id}
                                onChange={(e) => {
                                    const template = TEMPLATES.find(t => t.id === e.target.value);
                                    if(template) setSelectedTemplate(template);
                                }}
                                className="block w-full rounded-md border-gray-300 border p-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                            >
                                {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">{selectedTemplate.desc}</p>
                        </div>
                        
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Target Column 1</label>
                                <select 
                                    value={col1}
                                    onChange={(e) => setCol1(e.target.value)}
                                    className="block w-full rounded-md border-gray-300 border p-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm"
                                >
                                    {activeFile.columns.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            
                            {selectedTemplate.template.includes('{col2}') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Column 2</label>
                                    <select 
                                        value={col2}
                                        onChange={(e) => setCol2(e.target.value)}
                                        className="block w-full rounded-md border-gray-300 border p-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm"
                                    >
                                        {activeFile.columns.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-gray-100">
                        <Button type="submit">
                            Construct Formula
                        </Button>
                    </div>
                </form>
            </div>

            {formula && (
                <div className="mt-6 space-y-4 animate-fade-in">
                    <div className="bg-gray-900 rounded-lg p-4 relative group">
                        <div className="text-gray-400 text-xs mb-1 uppercase tracking-wider font-semibold">Result</div>
                        <code className="text-green-400 font-mono text-lg block overflow-x-auto pb-2">
                            {formula}
                        </code>
                        <button
                            onClick={copyToClipboard}
                            className="absolute top-4 right-4 p-2 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                            title="Copy to clipboard"
                        >
                            {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                        </button>
                    </div>

                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex-1 w-full">
                            <label className="block text-xs font-semibold text-indigo-800 mb-1">Destination Column</label>
                            <input 
                                type="text"
                                value={targetColumnName}
                                onChange={(e) => setTargetColumnName(e.target.value)}
                                className="block w-full rounded-md border-indigo-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 text-sm"
                            />
                        </div>
                        <Button 
                            onClick={handleSendToPipeline} 
                            variant="primary" 
                            className="whitespace-nowrap mt-4 sm:mt-0"
                        >
                            <ArrowRightCircle className="h-4 w-4 mr-2" />
                            Add to Operations
                        </Button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileSpreadsheet, FileText, FileType } from 'lucide-react';
import { Button } from './Button';
import { ExportFormat } from '../types';

interface ExportMenuProps {
  onExport: (format: ExportFormat) => void;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  trigger?: React.ReactNode;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({ 
  onExport, 
  label = "Export", 
  size = "md", 
  className = "",
  variant = "secondary",
  trigger
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
      {trigger ? (
        <div onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} className="cursor-pointer inline-flex">
          {trigger}
        </div>
      ) : (
        <Button 
          onClick={() => setIsOpen(!isOpen)} 
          variant={variant} 
          size={size}
          className="flex items-center"
        >
          <Download className="h-4 w-4 mr-2" />
          {label}
          <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
        </Button>
      )}

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1" role="menu">
            <button
              onClick={() => { onExport('xlsx'); setIsOpen(false); }}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center transition-colors border-b border-gray-100"
              role="menuitem"
            >
              <div className="bg-green-100 p-1.5 rounded mr-3">
                <FileSpreadsheet className="h-4 w-4 text-green-700" />
              </div>
              <div>
                <span className="block font-medium">Excel Workbook</span>
                <span className="block text-xs text-gray-500">*.xlsx</span>
              </div>
            </button>
            <button
              onClick={() => { onExport('csv'); setIsOpen(false); }}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center transition-colors border-b border-gray-100"
              role="menuitem"
            >
              <div className="bg-blue-100 p-1.5 rounded mr-3">
                <FileText className="h-4 w-4 text-blue-700" />
              </div>
              <div>
                <span className="block font-medium">CSV UTF-8 (Comma)</span>
                <span className="block text-xs text-gray-500">*.csv</span>
              </div>
            </button>
            <button
              onClick={() => { onExport('csv'); setIsOpen(false); }}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center transition-colors border-b border-gray-100"
              role="menuitem"
            >
              <div className="bg-blue-50 p-1.5 rounded mr-3">
                <FileType className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <span className="block font-medium">CSV (Comma delimited)</span>
                <span className="block text-xs text-gray-500">*.csv</span>
              </div>
            </button>
            <button
              onClick={() => { onExport('txt'); setIsOpen(false); }}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center transition-colors"
              role="menuitem"
            >
              <div className="bg-gray-100 p-1.5 rounded mr-3">
                <FileText className="h-4 w-4 text-gray-700" />
              </div>
               <div>
                <span className="block font-medium">Text (Tab delimited)</span>
                <span className="block text-xs text-gray-500">*.txt</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

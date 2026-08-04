import React, { ReactNode } from 'react';
import { AppTab } from '@/types';
import { 
  FileSpreadsheet, 
  Search, 
  Eraser, 
  Calculator, 
  BarChart, 
  Upload,
  GitCompare,
  Combine,
  Sparkles
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  fileCount: number;
}

const NavItem = ({ 
  tab, 
  active, 
  icon: Icon, 
  label, 
  onClick 
}: { 
  tab: AppTab; 
  active: boolean; 
  icon: React.ElementType; 
  label: string; 
  onClick: (t: AppTab) => void; 
}) => (
  <button
    onClick={() => onClick(tab)}
    className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
      active 
        ? 'bg-indigo-50 text-indigo-700' 
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`}
  >
    <Icon className={`h-5 w-5 ${active ? 'text-indigo-600' : 'text-gray-400'}`} />
    <span>{label}</span>
  </button>
);

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, fileCount }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 fixed h-full z-10">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <FileSpreadsheet className="h-8 w-8 text-indigo-600" />
          <span className="ml-2 text-xl font-bold text-gray-900">ExcelAI</span>
        </div>
        
        <div className="p-4 space-y-1">
          <NavItem 
            tab={AppTab.UPLOAD} 
            active={activeTab === AppTab.UPLOAD} 
            icon={Upload} 
            label="File Manager" 
            onClick={onTabChange} 
          />
          <div className="pt-4 pb-2">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Workspace</p>
          </div>
          <NavItem 
            tab={AppTab.CLEANING} 
            active={activeTab === AppTab.CLEANING} 
            icon={Eraser} 
            label="Operations" 
            onClick={onTabChange} 
          />
          <NavItem 
            tab={AppTab.VIEW} 
            active={activeTab === AppTab.VIEW} 
            icon={FileSpreadsheet} 
            label="Data View" 
            onClick={onTabChange} 
          />
          <NavItem 
            tab={AppTab.COMPARE} 
            active={activeTab === AppTab.COMPARE} 
            icon={GitCompare} 
            label="Compare Files" 
            onClick={onTabChange} 
          />
          <NavItem 
            tab={AppTab.MERGE} 
            active={activeTab === AppTab.MERGE} 
            icon={Combine} 
            label="Merge / Split" 
            onClick={onTabChange} 
          />
          <NavItem 
            tab={AppTab.VLOOKUP} 
            active={activeTab === AppTab.VLOOKUP} 
            icon={Search} 
            label="VLOOKUP AI" 
            onClick={onTabChange} 
          />
          <NavItem 
            tab={AppTab.ANALYSIS} 
            active={activeTab === AppTab.ANALYSIS} 
            icon={Sparkles} 
            label="Smart Insights" 
            onClick={onTabChange} 
          />
          <NavItem 
            tab={AppTab.FORMULA} 
            active={activeTab === AppTab.FORMULA} 
            icon={Calculator} 
            label="Formula AI" 
            onClick={onTabChange} 
          />
          <NavItem 
            tab={AppTab.VISUALIZE} 
            active={activeTab === AppTab.VISUALIZE} 
            icon={BarChart} 
            label="Visualizations" 
            onClick={onTabChange} 
          />
        </div>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {fileCount} Active File{fileCount !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  ExcelAI Master
                </p>
              </div>
            </div>
          </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
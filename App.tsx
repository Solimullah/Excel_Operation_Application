import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { AppTab, UploadedFile } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.UPLOAD);
  const [files] = useState<UploadedFile[]>([]);

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} fileCount={files.length}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">File Manager</h1>
        <p className="text-gray-500 mt-1">Manage your uploaded spreadsheets and data files.</p>
      </div>

      <div className="max-w-3xl mx-auto mt-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl font-bold">+</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Data Files</h2>
          <p className="text-gray-500">
            Spreadsheet parsing is not wired up yet.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default App;

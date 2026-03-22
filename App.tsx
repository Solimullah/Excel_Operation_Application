import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { FileUpload } from './components/FileUpload';
import { DataView } from './components/DataView';
import { AppTab, UploadedFile, ExportFormat } from './types';
import { readExcelFile, downloadExcelFile } from './utils/excelUtils';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.UPLOAD);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFilesSelect = async (filesToUpload: File[]) => {
    setIsProcessing(true);
    try {
      const newUploadedFiles = await Promise.all(
        filesToUpload.map(async (file) => {
          const { data, columns } = await readExcelFile(file);
          return {
            id: crypto.randomUUID(),
            name: file.name,
            data,
            columns
          } as UploadedFile;
        })
      );
      setFiles(prev => [...prev, ...newUploadedFiles]);
    } catch (error) {
      console.error("Error processing files", error);
      alert("Error reading one or more files. Please ensure they are valid .xlsx, .xls, .csv, or .txt files.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleDownload = (fileId: string, format: ExportFormat) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    // Create new name preserving original name but changing extension and adding modifier
    const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const newName = `${originalName}_modified.${format}`;

    downloadExcelFile(file.data, newName, format);
  };

  const renderContent = () => {
    if (activeTab === AppTab.UPLOAD) {
      return (
        <FileUpload
            files={files}
            onFilesSelect={handleFilesSelect}
            onRemoveFile={handleRemoveFile}
            isLoading={isProcessing}
        />
      );
    }

    if (files.length === 0) {
       return (
         <div className="text-center py-20">
           <p className="text-gray-500 mb-4">No files uploaded yet.</p>
           <button
             onClick={() => setActiveTab(AppTab.UPLOAD)}
             className="text-indigo-600 hover:text-indigo-800 font-medium"
           >
             Go to File Manager
           </button>
         </div>
       );
    }

    return (
      <>
        {activeTab === AppTab.VIEW && <DataView files={files} onDownload={handleDownload} />}
      </>
    );
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} fileCount={files.length}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
            {activeTab === AppTab.UPLOAD ? 'File Manager' : 'Data Overview'}
        </h1>
        <p className="text-gray-500 mt-1">
            {activeTab === AppTab.UPLOAD ? 'Manage your uploaded spreadsheets and data files.' :
             'View and export your data.'}
        </p>
      </div>
      {renderContent()}
    </Layout>
  );
};

export default App;

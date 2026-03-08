import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { FileUpload } from './components/FileUpload';
import { AppTab, UploadedFile } from './types';
import { readExcelFile } from './utils/excelUtils';

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

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} fileCount={files.length}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">File Manager</h1>
        <p className="text-gray-500 mt-1">Manage your uploaded spreadsheets and data files.</p>
      </div>

      <FileUpload
        files={files}
        onFilesSelect={handleFilesSelect}
        onRemoveFile={handleRemoveFile}
        isLoading={isProcessing}
      />
    </Layout>
  );
};

export default App;

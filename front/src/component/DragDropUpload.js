import React, { useState, useRef } from 'react';

const DragDropUpload = ({ onFilesSelected, maxSize = 10 }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const dropRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragOut = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const validateFiles = (files) => {
    const oversizedFiles = files.filter(file => file.size > maxSize * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      const fileNames = oversizedFiles.map(f => f.name).join(', ');
      throw new Error(`Files exceeding ${maxSize}MB limit: ${fileNames}`);
    }
    return true;
  };

  const processFiles = async (files) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const fileArray = Array.from(files);
      validateFiles(fileArray);
      
      await onFilesSelected(fileArray);
    } catch (error) {
      setError(error.message);
      console.error('Error processing files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  const handleFileSelect = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(e.target.files);
    }
  };

  return (
    <div
      ref={dropRef}
      className={`relative w-full h-64 border-2 border-dashed rounded-lg 
        ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'}
        ${error ? 'border-red-500' : ''}
        transition-all duration-200 ease-in-out`}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        multiple
        onChange={handleFileSelect}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isLoading}
      />
      <div className="flex flex-col items-center justify-center h-full space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Uploading files...</p>
          </div>
        ) : (
          <>
            <div className="text-4xl text-gray-400">
              <svg 
                className={`w-12 h-12 ${error ? 'text-red-500' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div className="text-center">
              {error ? (
                <p className="text-red-500 text-sm px-4">{error}</p>
              ) : (
                <>
                  <p className="text-gray-500 dark:text-gray-400">Drag and Drop here</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">or click to select files</p>
                  <p className="text-xs text-gray-400 mt-2">Maximum file size: {maxSize}MB</p>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DragDropUpload; 
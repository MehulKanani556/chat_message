import React, { useState, useEffect } from 'react';

const ScreenSourceSelector = ({ onSelect, onClose,selectedSource,setSelectedSource }) => {
  const [sources, setSources] = useState([]);

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    if (window.electron) {
      const availableSources = await window.electron.getSources();
      setSources(availableSources);
    }
  };

  const handleSourceSelect = (source) => {
    setSelectedSource(source);
    onSelect(source);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg max-w-2xl w-full">
        <h2 className="text-xl font-bold mb-4">Select Screen to Share</h2>
        <div className="grid grid-cols-2 gap-4">
          {sources.map(source => (
            <div
              key={source.id}
              className={`cursor-pointer p-2 rounded-lg border-2 ${
                selectedSource?.id === source.id 
                  ? 'border-blue-500' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              onClick={() => handleSourceSelect(source)}
            >
              <img 
                src={source.thumbnail.toDataURL()} 
                alt={source.name}
                className="w-full h-auto rounded"
              />
              <p className="mt-2 text-center">{source.name}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScreenSourceSelector;
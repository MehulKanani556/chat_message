import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setScreenSource, setShowScreenSource } from '../redux/slice/manageState.slice';

function ScreenSourceSelector({ onSelect }) {
  const dispatch = useDispatch()
  const [sources, setSources] = useState([]);
  const modalRef = useRef(null);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        dispatch(setShowScreenSource(false)); // ✅ Close modal
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dispatch]);

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    if (window.electron) {
      const availableSources = await window.electron.getSources();      
      setSources(availableSources);
    }
  };

  const handleSelectSource = async (source) => {
    await dispatch(setScreenSource(source));
    if (window.electron && window.electron.setActiveWindow) {
      window.electron.setActiveWindow(source.name);
    }
  };

  return (
    <div className="modal fixed inset-0 bg-black bg-opacity-30 overflow-y-auto h-screen w-full">
      <div   ref={modalRef} className="relative top-20 mx-auto p-5 w-full max-w-[600px] shadow-lg rounded-md bg-white dark:bg-primary-dark/100 dark:text-primary-light/70 ">
        <h2 className="text-lg text-center font-bold mb-4">Select a screen to share</h2>
        <div className="flex flex-wrap justify-content-center">
          {sources.map(source => (
            <div key={source.id} className="m-2 cursor-pointer rounded-md" onClick={() => handleSelectSource(source)}>
              <img
                src={source.thumbnail}
                alt={source.name}
                className="w-40 h-25 object-cover border border-gray-600 rounded-md"
              />
              <div className="text-center text-sm truncate max-w-40">{source.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ScreenSourceSelector;

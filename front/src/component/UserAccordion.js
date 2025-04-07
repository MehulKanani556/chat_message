import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp, FaPaperclip } from 'react-icons/fa';

const UserAccordion = ({ userData }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm">
      {/* Main accordion header */}
      <div 
        className="p-4 cursor-pointer flex items-center justify-between"
        onClick={toggleAccordion}
      >
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-gray-600 text-sm">Di</span>
          </div>
          {isOpen ? <FaChevronUp className="text-gray-500" /> : <FaChevronDown className="text-gray-500" />}
        </div>
      </div>

      {/* Accordion content */}
      {isOpen && (
        <div className="px-4 pb-4">
          {/* Nome */}
          <div className="mb-4">
            <p className="text-sm text-gray-500">Nome</p>
            <p className="text-gray-800">{userData?.name || "Patricia Smith"}</p>
          </div>

          {/* E-mail */}
          <div className="mb-4">
            <p className="text-sm text-gray-500">E-mail</p>
            <p className="text-gray-800">{userData?.email || "adc@123.com"}</p>
          </div>

          {/* Tempo */}
          <div className="mb-4">
            <p className="text-sm text-gray-500">Tempo</p>
            <p className="text-gray-800">{userData?.time || "11:40"}</p>
          </div>

          {/* Posizione */}
          <div className="mb-4">
            <p className="text-sm text-gray-500">Posizione</p>
            <p className="text-gray-800">{userData?.location || "California, USA"}</p>
          </div>

          {/* Files allegati */}
          <div className="pt-2 border-t border-gray-200">
            <div 
              className="flex items-center justify-between cursor-pointer py-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center space-x-2">
                <FaPaperclip className="text-gray-500" />
                <span className="text-gray-700">Files allegati</span>
              </div>
              <FaChevronDown className="text-gray-500" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAccordion; 
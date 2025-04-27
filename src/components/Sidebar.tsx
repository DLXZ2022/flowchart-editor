import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  title = '侧边栏', 
  children 
}) => {
  console.log('Sidebar render, isOpen:', isOpen);

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-y-0 right-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="h-full flex flex-col">
        <div className="px-4 py-3 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
            aria-label="关闭侧边栏"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 
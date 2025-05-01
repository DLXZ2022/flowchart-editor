import React, { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import { NodeDataType } from '../types';
import { XMarkIcon } from '@heroicons/react/24/outline';

// URL验证schema
const urlSchema = z.string().url({ message: "无效的 URL" }).or(z.string().length(0));

interface PropertiesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNode: {
    id: string;
    data: NodeDataType;
  } | null;
  onUpdateNodeData: (nodeId: string, data: Partial<NodeDataType>) => void;
}

const PropertiesSidebar: React.FC<PropertiesSidebarProps> = ({
  isOpen,
  onClose,
  selectedNode,
  onUpdateNodeData,
}) => {
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  // 当选中节点变化时，更新表单数据
  useEffect(() => {
    if (selectedNode) {
      setLabel(selectedNode.data.label || '');
      setUrl(selectedNode.data.url || '');
      setDescription(selectedNode.data.description || '');
      setUrlError(null);
    }
  }, [selectedNode]);

  // 处理标签变更
  const handleLabelChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newLabel = e.target.value;
    setLabel(newLabel);
    if (selectedNode) {
      onUpdateNodeData(selectedNode.id, { label: newLabel });
    }
  }, [selectedNode, onUpdateNodeData]);

  // 处理URL变更
  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    
    try {
      urlSchema.parse(newUrl);
      setUrlError(null);
      if (selectedNode) {
        onUpdateNodeData(selectedNode.id, { url: newUrl });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setUrlError(error.errors[0].message);
      }
    }
  }, [selectedNode, onUpdateNodeData]);

  // 处理描述变更
  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = e.target.value;
    setDescription(newDescription);
    if (selectedNode) {
      onUpdateNodeData(selectedNode.id, { description: newDescription });
    }
  }, [selectedNode, onUpdateNodeData]);

  // 如果没有选中节点或侧边栏关闭，不渲染内容
  if (!isOpen || !selectedNode) {
    return null;
  }

  return (
    <div className="fixed top-[60px] right-0 w-80 h-[calc(100vh-60px)] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-lg z-20 overflow-y-auto transition-transform duration-300 transform">
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">节点属性</h3>
        <button 
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="关闭属性面板"
        >
          <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>
      
      <div className="p-4 space-y-4">
        {/* 节点ID显示 */}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          节点ID: {selectedNode.id}
        </div>
        
        {/* 节点标签 */}
        <div className="space-y-1">
          <label htmlFor="node-label" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            标签 <span className="text-red-500">*</span>
          </label>
          <input
            id="node-label"
            type="text"
            value={label}
            onChange={handleLabelChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="输入节点标签"
            required
          />
        </div>
        
        {/* 节点URL */}
        <div className="space-y-1">
          <label htmlFor="node-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            URL
          </label>
          <input
            id="node-url"
            type="text"
            value={url}
            onChange={handleUrlChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
              urlError ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="https://example.com"
          />
          {urlError && (
            <p className="mt-1 text-sm text-red-500">{urlError}</p>
          )}
        </div>
        
        {/* 节点描述 */}
        <div className="space-y-1">
          <label htmlFor="node-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            描述
          </label>
          <textarea
            id="node-description"
            value={description}
            onChange={handleDescriptionChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="输入节点描述"
          />
        </div>
        
        {/* 节点类型（只读显示） */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            节点类型
          </label>
          <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300">
            {selectedNode.data.type === 'typeA' && '蓝色节点'}
            {selectedNode.data.type === 'typeB' && '绿色节点'}
            {selectedNode.data.type === 'typeC' && '黄色节点'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertiesSidebar; 
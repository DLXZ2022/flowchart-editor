import React, { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import type { NodeDataType, NodeTypeEnum } from '../types';
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import NodeTypeIcon from './NodeTypeIcon';

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
  onDeleteNode?: (nodeId: string) => void;
}

// 获取节点类型显示文本
const getNodeTypeText = (type: NodeTypeEnum): string => {
  switch (type) {
    case 'typeA': return '标题节点';
    case 'typeB': return '内容节点';
    case 'typeC': return '列表节点';
    default: return '未知节点';
  }
};

// 获取节点类型颜色
const getNodeTypeColor = (type: NodeTypeEnum): string => {
  switch (type) {
    case 'typeA': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    case 'typeB': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800';
    case 'typeC': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
  }
};

const PropertiesSidebar: React.FC<PropertiesSidebarProps> = ({
  isOpen,
  onClose,
  selectedNode,
  onUpdateNodeData,
  onDeleteNode,
}) => {
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');
  
  // 连接点数量状态
  const [handleCounts, setHandleCounts] = useState({
    top: 1,
    bottom: 1,
    left: 1,
    right: 1
  });

  // 当选中节点变化时，更新表单数据
  useEffect(() => {
    if (selectedNode) {
      setLabel(selectedNode.data.label || '');
      setUrl(selectedNode.data.url || '');
      setDescription(selectedNode.data.description || '');
      setUrlError(null);
      
      // 设置连接点数量
      setHandleCounts({
        top: selectedNode.data.handleCounts?.top ?? 1,
        bottom: selectedNode.data.handleCounts?.bottom ?? 1,
        left: selectedNode.data.handleCounts?.left ?? 1,
        right: selectedNode.data.handleCounts?.right ?? 1
      });
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

  // 处理节点类型变更
  const handleNodeTypeChange = useCallback((type: NodeTypeEnum) => {
    if (selectedNode) {
      onUpdateNodeData(selectedNode.id, { type });
    }
  }, [selectedNode, onUpdateNodeData]);

  // 处理连接点数量变更
  const handleHandleCountChange = useCallback((side: 'top' | 'bottom' | 'left' | 'right', value: string) => {
    const count = parseInt(value, 10);
    if (!isNaN(count) && count >= 0 && count <= 4) {
      setHandleCounts(prev => {
        const newCounts = { ...prev, [side]: count };
        
        // 更新节点数据
        if (selectedNode) {
          onUpdateNodeData(selectedNode.id, { 
            handleCounts: newCounts
          });
        }
        
        return newCounts;
      });
    }
  }, [selectedNode, onUpdateNodeData]);

  // 处理节点删除
  const handleDeleteNode = useCallback(() => {
    if (selectedNode && onDeleteNode) {
      if (window.confirm(`确定要删除节点 "${selectedNode.data.label || '未命名节点'}"?`)) {
        onDeleteNode(selectedNode.id);
        onClose();
      }
    }
  }, [selectedNode, onDeleteNode, onClose]);

  // 如果没有选中节点或侧边栏关闭，不渲染内容
  if (!isOpen || !selectedNode) {
    return null;
  }

  return (
    <div className="fixed top-[60px] right-0 w-80 h-[calc(100vh-60px)] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-lg z-20 overflow-y-auto transition-transform duration-300 transform animate-slideInRight">
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
      
      {/* 属性面板导航 */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            activeTab === 'basic' 
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('basic')}
        >
          基本属性
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            activeTab === 'advanced' 
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('advanced')}
        >
          高级设置
        </button>
      </div>
      
      <div className="p-4 space-y-4">
        {/* 节点基本信息 */}
        <div className="flex items-center mb-4 space-x-2">
          <div className={`p-2 rounded-md ${getNodeTypeColor(selectedNode.data.type as NodeTypeEnum)}`}>
            <NodeTypeIcon type={selectedNode.data.type} size={20} />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {getNodeTypeText(selectedNode.data.type as NodeTypeEnum)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              ID: {selectedNode.id}
            </div>
          </div>
        </div>
        
        {activeTab === 'basic' ? (
          <>
            {/* 基本属性 */}
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
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
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all ${
                  urlError ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="https://example.com"
              />
              {urlError && (
                <p className="mt-1 text-sm text-red-500 animate-fadeIn">{urlError}</p>
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
                placeholder="输入节点描述"
              />
            </div>
            
            {/* 节点类型选择 */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                节点类型
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  className={`p-2 rounded-md border transition-all ${
                    selectedNode.data.type === 'typeA'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => handleNodeTypeChange('typeA')}
                >
                  <div className="flex flex-col items-center">
                    <NodeTypeIcon type="typeA" size={24} />
                    <span className="text-xs mt-1">蓝色节点</span>
                  </div>
                </button>
                <button
                  className={`p-2 rounded-md border transition-all ${
                    selectedNode.data.type === 'typeB'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => handleNodeTypeChange('typeB')}
                >
                  <div className="flex flex-col items-center">
                    <NodeTypeIcon type="typeB" size={24} />
                    <span className="text-xs mt-1">绿色节点</span>
                  </div>
                </button>
                <button
                  className={`p-2 rounded-md border transition-all ${
                    selectedNode.data.type === 'typeC'
                      ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => handleNodeTypeChange('typeC')}
                >
                  <div className="flex flex-col items-center">
                    <NodeTypeIcon type="typeC" size={24} />
                    <span className="text-xs mt-1">黄色节点</span>
                  </div>
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* 高级设置 */}
            {/* 连接点设置 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                连接点数量
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">顶部</label>
                  <input
                    type="number"
                    min="0"
                    max="4"
                    value={handleCounts.top}
                    onChange={(e) => handleHandleCountChange('top', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">底部</label>
                  <input
                    type="number"
                    min="0"
                    max="4"
                    value={handleCounts.bottom}
                    onChange={(e) => handleHandleCountChange('bottom', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">左侧</label>
                  <input
                    type="number"
                    min="0"
                    max="4"
                    value={handleCounts.left}
                    onChange={(e) => handleHandleCountChange('left', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">右侧</label>
                  <input
                    type="number"
                    min="0"
                    max="4"
                    value={handleCounts.right}
                    onChange={(e) => handleHandleCountChange('right', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
                  />
                </div>
              </div>
              
              <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  连接点用于节点之间建立连接。您可以为每个方向设置0-4个连接点。
                </p>
              </div>
            </div>
            
            {/* 元数据设置 - 预留 */}
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">未来功能</h4>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-xs text-gray-500 dark:text-gray-400">
                更多节点配置选项将在未来版本中添加，如：自定义样式、数据验证规则、动画效果等。
              </div>
            </div>
          </>
        )}
        
        {/* 删除按钮 */}
        {onDeleteNode && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
            <button
              onClick={handleDeleteNode}
              className="w-full flex items-center justify-center px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-md transition-colors"
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              删除节点
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesSidebar; 
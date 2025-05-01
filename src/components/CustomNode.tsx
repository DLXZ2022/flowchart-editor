import React, { useState, useCallback } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { z } from 'zod';
import { NodeDataType } from '../types';

// 添加链接图标
import { LinkIcon } from '@heroicons/react/24/outline';

// URL验证schema
const urlSchema = z.string().url({ message: "无效的 URL" });

// 节点类型样式
const nodeTypeStyles = {
  typeA: 'bg-blue-500 border-blue-700',
  typeB: 'bg-green-500 border-green-700',
  typeC: 'bg-yellow-500 border-yellow-700',
} as const;

type NodeType = keyof typeof nodeTypeStyles;

// 自定义节点组件
type CustomNodeProps = {
  id: string;
  data: NodeDataType;
  isConnectable: boolean;
};

const CustomNode: React.FC<CustomNodeProps> = ({ id, data, isConnectable }) => {
  const { setNodes } = useReactFlow();
  const [url, setUrl] = useState(data.url || '');
  const [label, setLabel] = useState(data.label || '');
  const [description, setDescription] = useState(data.description || '');
  const [urlError, setUrlError] = useState<string | null>(null);
  
  // 为连接点数量添加状态
  const [handleCounts, setHandleCounts] = useState({
    top: data.handleCounts?.top ?? 1,
    bottom: data.handleCounts?.bottom ?? 1,
    left: data.handleCounts?.left ?? 1,
    right: data.handleCounts?.right ?? 1
  });
  
  // 获取翻转状态
  const flipped = !!data.flipped;

  // 更新节点数据
  const updateNodeData = useCallback((updates: Partial<NodeDataType>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              ...updates,
            },
          };
        }
        return node;
      })
    );
  }, [id, setNodes]);

  // 删除节点
  const deleteNode = useCallback(() => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
  }, [id, setNodes]);

  // 处理URL变更
  const handleUrlChange = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = evt.target.value;
    setUrl(newUrl);
    
    try {
      if (newUrl) {
        urlSchema.parse(newUrl);
        setUrlError(null);
      } else {
        setUrlError(null);
      }
      
      updateNodeData({ url: newUrl });
    } catch (error) {
      if (error instanceof z.ZodError) {
        setUrlError(error.errors[0].message);
      }
    }
  }, [updateNodeData]);

  // 处理标题变更
  const handleLabelChange = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
    const newLabel = evt.target.value;
    setLabel(newLabel);
    updateNodeData({ label: newLabel });
  }, [updateNodeData]);

  // 处理描述变更
  const handleDescriptionChange = useCallback((evt: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = evt.target.value;
    setDescription(newDescription);
    updateNodeData({ description: newDescription });
  }, [updateNodeData]);

  // 处理连接点数量变更
  const handleCountChange = useCallback((side: 'top' | 'bottom' | 'left' | 'right', value: string) => {
    const count = parseInt(value, 10);
    if (!isNaN(count) && count >= 0 && count <= 4) {
      setHandleCounts(prev => {
        const newCounts = { ...prev, [side]: count };
        // 同时更新节点数据
        updateNodeData({ 
          handleCounts: newCounts
        });
        return newCounts;
      });
    }
  }, [updateNodeData]);

  // 获取节点样式
  const nodeStyle = nodeTypeStyles[data.type as NodeType] || 'bg-gray-500 border-gray-700';

  // 处理URL点击事件
  const handleUrlClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation(); // 阻止事件冒泡，不触发节点选择
    
    if (data.url) {
      window.open(data.url, '_blank');
    }
  }, [data.url]);

  // 生成连接点列表
  const renderHandles = () => {
    if (flipped) return null; // 在编辑模式下不显示连接点
    
    // 获取实际连接点数量（默认为1）
    const counts = {
      top: data.handleCounts?.top ?? 1,
      bottom: data.handleCounts?.bottom ?? 1,
      left: data.handleCounts?.left ?? 1,
      right: data.handleCounts?.right ?? 1
    };
    
    const handles = [];
    
    // 顶部连接点
    for (let i = 0; i < counts.top; i++) {
      const percentage = (i + 1) * 100 / (counts.top + 1);
      handles.push(
        <React.Fragment key={`top-${i}`}>
          <Handle
            type="target"
            id={`top-${i}-target`}
            position={Position.Top}
            isConnectable={isConnectable}
            className="w-4 h-4 bg-gray-200 border border-gray-400 rounded-full"
            style={{ left: `${percentage}%`, zIndex: 10 }}
          />
          <Handle
            type="source"
            id={`top-${i}-source`}
            position={Position.Top}
            isConnectable={isConnectable}
            className="w-4 h-4 bg-transparent"
            style={{ left: `${percentage}%`, zIndex: 9 }}
          />
        </React.Fragment>
      );
    }
    
    // 底部连接点
    for (let i = 0; i < counts.bottom; i++) {
      const percentage = (i + 1) * 100 / (counts.bottom + 1);
      handles.push(
        <React.Fragment key={`bottom-${i}`}>
          <Handle
            type="source"
            id={`bottom-${i}-source`}
            position={Position.Bottom}
            isConnectable={isConnectable}
            className="w-4 h-4 bg-gray-200 border border-gray-400 rounded-full"
            style={{ left: `${percentage}%`, zIndex: 10 }}
          />
          <Handle
            type="target"
            id={`bottom-${i}-target`}
            position={Position.Bottom}
            isConnectable={isConnectable}
            className="w-4 h-4 bg-transparent"
            style={{ left: `${percentage}%`, zIndex: 9 }}
          />
        </React.Fragment>
      );
    }
    
    // 左侧连接点
    for (let i = 0; i < counts.left; i++) {
      const percentage = (i + 1) * 100 / (counts.left + 1);
      handles.push(
        <React.Fragment key={`left-${i}`}>
          <Handle
            type="target"
            id={`left-${i}-target`}
            position={Position.Left}
            isConnectable={isConnectable}
            className="w-4 h-4 bg-gray-200 border border-gray-400 rounded-full"
            style={{ top: `${percentage}%`, zIndex: 10 }}
          />
          <Handle
            type="source"
            id={`left-${i}-source`}
            position={Position.Left}
            isConnectable={isConnectable}
            className="w-4 h-4 bg-transparent"
            style={{ top: `${percentage}%`, zIndex: 9 }}
          />
        </React.Fragment>
      );
    }
    
    // 右侧连接点
    for (let i = 0; i < counts.right; i++) {
      const percentage = (i + 1) * 100 / (counts.right + 1);
      handles.push(
        <React.Fragment key={`right-${i}`}>
          <Handle
            type="source"
            id={`right-${i}-source`}
            position={Position.Right}
            isConnectable={isConnectable}
            className="w-4 h-4 bg-gray-200 border border-gray-400 rounded-full"
            style={{ top: `${percentage}%`, zIndex: 10 }}
          />
          <Handle
            type="target"
            id={`right-${i}-target`}
            position={Position.Right}
            isConnectable={isConnectable}
            className="w-4 h-4 bg-transparent"
            style={{ top: `${percentage}%`, zIndex: 9 }}
          />
        </React.Fragment>
      );
    }
    
    return handles;
  };

  // 渲染
  if (flipped) {
    // 编辑模式
    return (
      <div className="p-4 border-2 rounded-lg shadow-md bg-white dark:bg-gray-800 dark:border-gray-700 w-[300px]">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">编辑节点</h3>
        
        {/* 标签输入 */}
        <div className="mb-4">
          <label htmlFor="node-label" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            标签 <span className="text-red-500">*</span>
          </label>
          <input
            id="node-label"
            type="text"
            value={label}
            onChange={handleLabelChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
            placeholder="节点标签"
            required
          />
        </div>
        
        {/* URL输入 */}
        <div className="mb-4">
          <label htmlFor="node-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            URL
          </label>
          <input
            id="node-url"
            type="text"
            value={url}
            onChange={handleUrlChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 ${
              urlError ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="https://example.com"
          />
          {urlError && (
            <p className="mt-1 text-sm text-red-500 dark:text-red-400">{urlError}</p>
          )}
        </div>
        
        {/* 描述输入 */}
        <div className="mb-4">
          <label htmlFor="node-desc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            描述
          </label>
          <textarea
            id="node-desc"
            value={description}
            onChange={handleDescriptionChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
            placeholder="节点描述"
          />
        </div>
        
        {/* 连接点设置 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            连接点数量
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400">顶部</label>
              <input
                type="number"
                min="0"
                max="4"
                value={handleCounts.top}
                onChange={(e) => handleCountChange('top', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400">底部</label>
              <input
                type="number"
                min="0"
                max="4"
                value={handleCounts.bottom}
                onChange={(e) => handleCountChange('bottom', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400">左侧</label>
              <input
                type="number"
                min="0"
                max="4"
                value={handleCounts.left}
                onChange={(e) => handleCountChange('left', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400">右侧</label>
              <input
                type="number"
                min="0"
                max="4"
                value={handleCounts.right}
                onChange={(e) => handleCountChange('right', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>
        </div>
        
        {/* 操作按钮 */}
        <div className="flex justify-between">
          <button
            onClick={() => updateNodeData({ flipped: false })}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
          >
            完成
          </button>
          <button
            onClick={deleteNode}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
          >
            删除
          </button>
        </div>
      </div>
    );
  } else {
    // 正面显示
    return (
      <>
        {renderHandles()}
        <div className={`px-4 py-2 border-2 rounded-lg shadow-md ${nodeStyle} relative min-w-[150px] min-h-[60px] transition-shadow duration-200 hover:shadow-lg`}>
          <div className="text-white font-medium text-lg mb-1 pr-6">
            {data.label || '未命名节点'}
            
            {/* URL指示图标和点击功能 */}
            {data.url && (
              <button 
                onClick={handleUrlClick}
                className="absolute top-2 right-2 p-1 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors"
                title={`访问链接: ${data.url}`}
              >
                <LinkIcon className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
          
          {data.description && (
            <div className="text-white text-opacity-80 text-sm truncate max-w-[180px]" title={data.description}>
              {data.description}
            </div>
          )}

          <div className="text-xs text-white opacity-75 text-right mt-2">
            右键点击编辑
          </div>
        </div>
      </>
    );
  }
};

export default CustomNode;
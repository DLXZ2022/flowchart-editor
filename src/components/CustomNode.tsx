import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, useReactFlow, NodeToolbar } from '@xyflow/react';
import { z } from 'zod';
import { NodeDataType } from '../types';
import NodeTooltip from './NodeTooltip';
import NodeTypeIcon from './NodeTypeIcon';

// 添加链接图标
import { LinkIcon } from '@heroicons/react/24/outline';

// URL验证schema
const urlSchema = z.string().url({ message: "无效的 URL" });

// 节点类型样式映射
const nodeTypeStyles = {
  typeA: {
    border: 'border-blue-500',
    accent: 'border-l-4 border-l-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  typeB: {
    border: 'border-green-500',
    accent: 'border-l-4 border-l-green-500',
    bg: 'bg-green-50 dark:bg-green-900/20',
    icon: 'text-green-600 dark:text-green-400',
  },
  typeC: {
    border: 'border-yellow-500',
    accent: 'border-l-4 border-l-yellow-500',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    icon: 'text-yellow-600 dark:text-yellow-400',
  },
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
  const nodeRef = useRef<HTMLDivElement>(null);
  
  // 节点悬停状态
  const [isHovering, setIsHovering] = useState(false);
  // 计时器，用于延迟显示tooltip
  const hoverTimerRef = useRef<number | null>(null);
  
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
  const nodeStyle = nodeTypeStyles[data.type as NodeType] || nodeTypeStyles.typeA;

  // 鼠标悬停事件
  const handleMouseEnter = useCallback(() => {
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current);
    }
    
    hoverTimerRef.current = window.setTimeout(() => {
      setIsHovering(true);
    }, 200);
  }, []);

  // 鼠标离开事件
  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setIsHovering(false);
  }, []);

  // 在组件卸载时清除定时器
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        window.clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

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
    // 正面显示 - 新的简洁设计
    return (
      <>
        {renderHandles()}
        
        {/* 使用NodeToolbar组件来显示tooltip，它会自动处理定位问题 */}
        <NodeToolbar 
          nodeId={id}
          isVisible={isHovering}
          position={Position.Right} // 位置在节点右侧
          offset={10} // 与节点的距离
          align="center" // 对齐方式
          className="z-50"
        >
          <NodeTooltip data={data} />
        </NodeToolbar>
        
        <div 
          ref={nodeRef}
          className={`border rounded-md shadow-sm ${nodeStyle.border} ${nodeStyle.bg} ${nodeStyle.accent} transition-shadow duration-200 hover:shadow-md min-w-[120px]`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* 节点主内容 */}
          <div className="px-3 py-2 flex items-center">
            {/* 图标 */}
            <div className={`flex-shrink-0 mr-2 ${nodeStyle.icon}`}>
              <NodeTypeIcon type={data.type} size={16} />
            </div>
            
            {/* 标题 (短摘要) */}
            <div className="flex-grow truncate text-sm font-medium text-gray-800 dark:text-gray-200">
              {data.label ? (
                data.label.length > 20 ? data.label.substring(0, 20) + '...' : data.label
              ) : '未命名节点'}
            </div>
            
            {/* URL指示图标 */}
            {data.url && (
              <div className="flex-shrink-0 ml-1 text-gray-500 dark:text-gray-400">
                <LinkIcon className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
          
          <div className="text-[10px] text-right text-gray-500 dark:text-gray-400 pr-2 pb-1">
            悬停查看详情
          </div>
        </div>
      </>
    );
  }
};

export default CustomNode;
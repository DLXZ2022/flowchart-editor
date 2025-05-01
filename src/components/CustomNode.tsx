import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, useReactFlow, NodeToolbar } from '@xyflow/react';
import { z } from 'zod';
import type { NodeDataType } from '../types';
import NodeTooltip from './NodeTooltip';
import NodeTypeIcon from './NodeTypeIcon';

// 添加链接图标
import { LinkIcon, PencilIcon } from '@heroicons/react/24/outline';

// URL验证schema
const urlSchema = z.string().url({ message: "无效的 URL" });

// 节点类型样式映射
const nodeTypeStyles = {
  typeA: {
    border: 'border-blue-500',
    accent: 'border-l-4 border-l-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: 'text-blue-600 dark:text-blue-400',
    hoverBg: 'hover:bg-blue-100 dark:hover:bg-blue-900/30',
    activeBg: 'active:bg-blue-200 dark:active:bg-blue-900/40',
    shadowHover: 'hover:shadow-md hover:shadow-blue-200/50 dark:hover:shadow-blue-900/30',
  },
  typeB: {
    border: 'border-green-500',
    accent: 'border-l-4 border-l-green-500',
    bg: 'bg-green-50 dark:bg-green-900/20',
    icon: 'text-green-600 dark:text-green-400',
    hoverBg: 'hover:bg-green-100 dark:hover:bg-green-900/30',
    activeBg: 'active:bg-green-200 dark:active:bg-green-900/40',
    shadowHover: 'hover:shadow-md hover:shadow-green-200/50 dark:hover:shadow-green-900/30',
  },
  typeC: {
    border: 'border-yellow-500',
    accent: 'border-l-4 border-l-yellow-500',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    icon: 'text-yellow-600 dark:text-yellow-400',
    hoverBg: 'hover:bg-yellow-100 dark:hover:bg-yellow-900/30',
    activeBg: 'active:bg-yellow-200 dark:active:bg-yellow-900/40',
    shadowHover: 'hover:shadow-md hover:shadow-yellow-200/50 dark:hover:shadow-yellow-900/30',
  },
} as const;

type NodeType = keyof typeof nodeTypeStyles;

// 自定义节点组件
type CustomNodeProps = {
  id: string;
  data: NodeDataType;
  isConnectable: boolean;
  selected?: boolean;
};

const CustomNode: React.FC<CustomNodeProps> = ({ id, data, isConnectable, selected }) => {
  const { setNodes } = useReactFlow();
  const [url, setUrl] = useState(data.url || '');
  const [label, setLabel] = useState(data.label || '');
  const [description, setDescription] = useState(data.description || '');
  const [urlError, setUrlError] = useState<string | null>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 节点悬停状态
  const [isHovering, setIsHovering] = useState(false);
  
  // 添加内部编辑状态
  const [isEditing, setIsEditing] = useState(false);
  
  // 计时器，用于延迟显示tooltip
  const hoverTimerRef = useRef<number | null>(null);
  
  // 动画状态
  const [isAnimating, setIsAnimating] = useState(false);
  
  // 为连接点数量添加状态
  const [handleCounts, setHandleCounts] = useState({
    top: data.handleCounts?.top ?? 1,
    bottom: data.handleCounts?.bottom ?? 1,
    left: data.handleCounts?.left ?? 1,
    right: data.handleCounts?.right ?? 1
  });
  
  // 当使用外部编辑属性(isEditing)时，保持内部状态同步
  useEffect(() => {
    if (data.isEditing !== undefined) {
      setIsEditing(data.isEditing);
    }
  }, [data.isEditing]);

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

  // 播放动画效果
  const playAnimation = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 500);
  }, []);
  
  // 处理双击快速编辑标签
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    setIsEditing(true);
    updateNodeData({ isEditing: true });
    
    // 确保在下一个渲染周期后聚焦输入框
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 10);
  }, [updateNodeData]);
  
  // 标签编辑完成
  const handleLabelEditFinish = useCallback(() => {
    setIsEditing(false);
    updateNodeData({ isEditing: false });
  }, [updateNodeData]);
  
  // 处理键盘按键
  const handleLabelKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLabelEditFinish();
    } else if (e.key === 'Escape') {
      handleLabelEditFinish();
    }
  }, [handleLabelEditFinish]);

  // 生成连接点列表
  const renderHandles = () => {
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
            className="w-4 h-4 bg-gray-200 border border-gray-400 rounded-full hover:bg-gray-300 hover:border-gray-500 transition-all"
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
            className="w-4 h-4 bg-gray-200 border border-gray-400 rounded-full hover:bg-gray-300 hover:border-gray-500 transition-all"
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
            className="w-4 h-4 bg-gray-200 border border-gray-400 rounded-full hover:bg-gray-300 hover:border-gray-500 transition-all"
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
            className="w-4 h-4 bg-gray-200 border border-gray-400 rounded-full hover:bg-gray-300 hover:border-gray-500 transition-all"
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

  // 正面显示 - 优化视觉设计
  return (
    <>
      {renderHandles()}
      
      {/* 使用NodeToolbar组件来显示tooltip，它会自动处理定位问题 */}
      <NodeToolbar 
        nodeId={id}
        isVisible={isHovering}
        position={Position.Top}
        className="bg-white dark:bg-gray-800 shadow-lg rounded-md p-1 border dark:border-gray-700 z-50"
      >
        <NodeTooltip 
          data={data}
        />
      </NodeToolbar>
      
      <div
        ref={nodeRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDoubleClick={handleDoubleClick}
        className={`
          border rounded-md transition-all duration-200 
          ${nodeStyle.border} ${selected ? 'shadow-md' : ''} ${nodeStyle.bg} 
          ${nodeStyle.shadowHover} ${isAnimating ? 'animate-pulse-once' : ''}
          ${isHovering ? 'scale-105' : ''}
        `}
        data-node-id={id}
      >
        {/* 标题栏和类型图标 */}
        <div className={`
          flex items-center justify-between px-2 py-1.5 border-b ${nodeStyle.border}
          ${nodeStyle.accent}
        `}>
          <div className="flex items-center space-x-2">
            <NodeTypeIcon type={data.type} size={16} className={nodeStyle.icon} />
            
            {/* 当编辑状态为true时显示输入框 */}
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onBlur={() => {
                  updateNodeData({ label });
                  handleLabelEditFinish();
                }}
                onKeyDown={handleLabelKeyDown}
                className="bg-transparent border-b border-gray-400 focus:border-blue-500 outline-none px-1 py-0.5 text-sm font-medium dark:text-white max-w-[140px]"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="font-medium text-sm truncate max-w-[140px] dark:text-white">
                {label || "未命名节点"}
              </span>
            )}
          </div>
          
          {/* 只在有URL时显示链接图标 */}
          {data.url && (
            <a 
              href={data.url} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={`p-0.5 rounded ${nodeStyle.hoverBg} ${nodeStyle.activeBg}`}
              title={data.url}
            >
              <LinkIcon className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
            </a>
          )}
        </div>
        
        {/* 内容区 */}
        <div className="px-2 py-1.5 min-w-[180px] min-h-[30px]">
          {data.description ? (
            <p className="text-xs text-gray-700 dark:text-gray-300 overflow-hidden text-ellipsis">
              {data.description.length > 30 ? data.description.substring(0, 30) + '...' : data.description}
            </p>
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500 italic">
              无节点描述
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default React.memo(CustomNode);
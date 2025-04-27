import React, { useState, useCallback } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { z } from 'zod';
import { NodeDataType } from '../types';

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

  return (
    <>
      {/* 动态渲染连接点 */}
      {renderHandles()}
      
      {/* 节点主体 */}
      <div className={`relative border-2 rounded-lg shadow-lg p-4 w-full h-full ${flipped ? 'bg-white' : nodeStyle}`}>
        {!flipped ? (
          // 正面显示
          <>
            <div className="font-bold text-xl mb-2 text-white">{label}</div>
            <p className="text-white text-opacity-90 mb-4 text-sm">
              {description || '(没有描述)'}
            </p>
            <div className="text-xs text-white opacity-75 text-right mt-2">
              右键点击编辑
            </div>
          </>
        ) : (
          // 反面编辑表单
          <>
            <button 
              onClick={deleteNode}
              className="absolute top-2 right-2 text-gray-500 hover:text-red-600 p-1 rounded-full text-xs bg-gray-100 hover:bg-gray-200 transition-colors"
              title="删除节点"
            >
              X
            </button>
            <div className="font-bold text-gray-700 mb-4 text-center">编辑节点</div>
            
            {/* 标题输入 */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标题:
              </label>
              <input
                type="text"
                value={label}
                onChange={handleLabelChange}
                className="w-full px-3 py-2 rounded border border-gray-300 text-sm"
                placeholder="节点标题"
              />
            </div>
            
            {/* URL输入 */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                网址:
              </label>
              <input
                type="text"
                value={url}
                onChange={handleUrlChange}
                className={`w-full px-3 py-2 rounded border text-sm ${
                  urlError ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="https://example.com"
              />
              {urlError && <p className="text-red-500 text-xs mt-1">{urlError}</p>}
            </div>
            
            {/* 描述输入 */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                描述:
              </label>
              <textarea
                value={description}
                onChange={handleDescriptionChange}
                className="w-full px-3 py-2 rounded border border-gray-300 text-sm"
                placeholder="节点描述"
                rows={3}
              ></textarea>
            </div>
            
            {/* 连接点数量设置 */}
            <div className="mb-3">
              <div className="font-medium text-gray-700 mb-2 text-sm">连接点设置:</div>
              <div className="grid grid-cols-2 gap-2">
                {/* 顶部连接点 */}
                <div className="mb-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    顶部连接点:
                  </label>
                  <select
                    value={handleCounts.top}
                    onChange={(e) => handleCountChange('top', e.target.value)}
                    className="w-full px-2 py-1 rounded border border-gray-300 text-sm"
                  >
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                  </select>
                </div>
                
                {/* 底部连接点 */}
                <div className="mb-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    底部连接点:
                  </label>
                  <select
                    value={handleCounts.bottom}
                    onChange={(e) => handleCountChange('bottom', e.target.value)}
                    className="w-full px-2 py-1 rounded border border-gray-300 text-sm"
                  >
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                  </select>
                </div>
                
                {/* 左侧连接点 */}
                <div className="mb-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    左侧连接点:
                  </label>
                  <select
                    value={handleCounts.left}
                    onChange={(e) => handleCountChange('left', e.target.value)}
                    className="w-full px-2 py-1 rounded border border-gray-300 text-sm"
                  >
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                  </select>
                </div>
                
                {/* 右侧连接点 */}
                <div className="mb-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    右侧连接点:
                  </label>
                  <select
                    value={handleCounts.right}
                    onChange={(e) => handleCountChange('right', e.target.value)}
                    className="w-full px-2 py-1 rounded border border-gray-300 text-sm"
                  >
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 text-right mt-2">
              右键点击返回
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default CustomNode;
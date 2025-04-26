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

  // 获取节点样式
  const nodeStyle = nodeTypeStyles[data.type as NodeType] || 'bg-gray-500 border-gray-700';

  return (
    <>
      {/* 顶部连接点 */}
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-white"
      />

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
            
            <div className="text-xs text-gray-500 text-right mt-2">
              右键点击返回
            </div>
          </>
        )}
      </div>

      {/* 底部连接点 */}
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-white"
      />
    </>
  );
};

export default CustomNode;
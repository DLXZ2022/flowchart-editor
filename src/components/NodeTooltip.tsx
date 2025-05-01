import React from 'react';
import type { NodeDataType } from '../types';
import NodeTypeIcon from './NodeTypeIcon';

// 工具提示类型
type NodeTooltipProps = {
  data: NodeDataType;
  nodeRect?: DOMRect;
};

// 获取节点类型文本
const getNodeTypeText = (type: string): string => {
  switch (type) {
    case 'typeA': return '标题节点';
    case 'typeB': return '内容节点';
    case 'typeC': return '列表节点';
    default: return '未知节点类型';
  }
};

// 获取节点类型颜色类
const getNodeTypeColor = (type: string): string => {
  switch (type) {
    case 'typeA': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-700';
    case 'typeB': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-700';
    case 'typeC': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
  }
};

const NodeTooltip: React.FC<NodeTooltipProps> = ({ data, nodeRect }) => {
  const hasUrl = !!data.url;
  
  return (
    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg border border-gray-200 dark:border-gray-700 p-3 max-w-sm z-50 animate-fadeIn">
      {/* 标题和类型标签 */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {data.label || '未命名节点'}
        </h3>
        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${getNodeTypeColor(data.type)} flex-shrink-0 inline-flex items-center`}>
          <NodeTypeIcon type={data.type} size={12} className="mr-1" />
          {getNodeTypeText(data.type)}
        </span>
      </div>
      
      {/* 描述内容 */}
      {data.description && (
        <div className="mb-2">
          <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-line">
            {data.description}
          </p>
        </div>
      )}
      
      {/* URL链接 */}
      {hasUrl && (
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          <a 
            href={data.url} 
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate inline-block max-w-full"
          >
            {data.url}
          </a>
        </div>
      )}
      
      {/* 连接点信息 */}
      {data.handleCounts && (
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 grid grid-cols-4 gap-1">
          <div className="text-center">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 block">顶部</span>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {data.handleCounts.top || 0}
            </span>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 block">底部</span>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {data.handleCounts.bottom || 0}
            </span>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 block">左侧</span>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {data.handleCounts.left || 0}
            </span>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 block">右侧</span>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {data.handleCounts.right || 0}
            </span>
          </div>
        </div>
      )}
      
      {/* 节点ID信息 - 调试用 */}
      <div className="mt-2 pt-1 border-t border-gray-100 dark:border-gray-700">
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          双击节点编辑 | 拖动节点移动位置
        </span>
      </div>
    </div>
  );
};

export default NodeTooltip; 
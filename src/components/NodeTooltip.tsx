import React from 'react';
import { LinkIcon } from '@heroicons/react/24/outline';
import { NodeDataType } from '../types';

// 简化props，只需要data属性
interface NodeTooltipProps {
  data: NodeDataType;
}

// 获取节点类型显示文本
const getNodeTypeText = (type: string): string => {
  switch (type) {
    case 'typeA': return '标题';
    case 'typeB': return '段落';
    case 'typeC': return '列表';
    default: return '节点';
  }
};

// 获取类型颜色
const getTypeColor = (type: string): string => {
  switch (type) {
    case 'typeA': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    case 'typeB': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800';
    case 'typeC': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
  }
};

const NodeTooltip: React.FC<NodeTooltipProps> = ({ data }) => {
  const handleUrlClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (data.url) {
      window.open(data.url, '_blank');
    }
  };

  const typeColorClass = getTypeColor(data.type);

  return (
    <div 
      className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 p-3 max-w-md"
      style={{
        minWidth: '280px',
      }}
    >
      <div className="flex justify-between items-start mb-3">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeColorClass}`}>
          {getNodeTypeText(data.type)}
        </span>
      </div>
      
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2 border-b border-gray-100 dark:border-gray-700 pb-2">
        {data.label || '未命名节点'}
      </h3>
      
      {data.description && (
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-3 whitespace-pre-wrap leading-relaxed">
          {data.description}
        </div>
      )}
      
      {data.url && (
        <div 
          className="flex items-center text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer mt-2 border-t border-gray-100 dark:border-gray-700 pt-2"
          onClick={handleUrlClick}
        >
          <LinkIcon className="w-3 h-3 mr-1 flex-shrink-0" />
          <span className="truncate">{data.url}</span>
        </div>
      )}
    </div>
  );
};

export default NodeTooltip; 
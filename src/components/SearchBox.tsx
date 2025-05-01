import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ReactFlowInstance, Node } from '@xyflow/react';
import type { NodeDataType } from '../types';

interface SearchResult {
  id: string;
  label: string;
  matchType: 'label' | 'description' | 'url';
}

interface SearchBoxProps {
  rfInstance: ReactFlowInstance | null;
  onFocusNode: (nodeId: string) => void;
  className?: string;
}

const SearchBox: React.FC<SearchBoxProps> = ({ rfInstance, onFocusNode, className = '' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 处理搜索输入变化
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (!query.trim() || !rfInstance) {
      setResults([]);
      return;
    }
    
    // 获取所有节点并进行搜索
    const nodes = rfInstance.getNodes();
    const lowerQuery = query.toLowerCase();
    
    // 搜索逻辑 - 匹配标签、描述或URL
    const matchedResults: SearchResult[] = [];
    
    nodes.forEach(node => {
      const data = node.data as NodeDataType;
      const label = data.label || '';
      const description = data.description || '';
      const url = data.url || '';
      
      if (label.toLowerCase().includes(lowerQuery)) {
        matchedResults.push({
          id: node.id,
          label: data.label,
          matchType: 'label'
        });
      } else if (description.toLowerCase().includes(lowerQuery)) {
        matchedResults.push({
          id: node.id,
          label: data.label,
          matchType: 'description'
        });
      } else if (url.toLowerCase().includes(lowerQuery)) {
        matchedResults.push({
          id: node.id,
          label: data.label,
          matchType: 'url'
        });
      }
    });
    
    setResults(matchedResults);
  };
  
  // 处理点击搜索结果
  const handleResultClick = (nodeId: string) => {
    onFocusNode(nodeId);
    setSearchQuery('');
    setResults([]);
    setIsOpen(false);
  };
  
  // 清除搜索
  const clearSearch = () => {
    setSearchQuery('');
    setResults([]);
    inputRef.current?.focus();
  };
  
  // 切换搜索框的展开状态
  const toggleSearch = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };
  
  // 处理点击外部关闭搜索结果
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && 
        event.target instanceof globalThis.Node &&
        !inputRef.current.contains(event.target) &&
        !(event.target as HTMLElement).closest('.search-results')
      ) {
        setResults([]);
        if (!searchQuery) {
          setIsOpen(false);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchQuery]);
  
  return (
    <div className={`relative ${className}`}>
      <div className={`flex items-center transition-all duration-300 ${isOpen ? 'w-64' : 'w-10'} overflow-hidden`}>
        <button
          onClick={toggleSearch}
          className="flex items-center justify-center w-10 h-10 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-l hover:bg-gray-200 dark:hover:bg-gray-600"
          aria-label={isOpen ? "关闭搜索" : "打开搜索"}
        >
          <MagnifyingGlassIcon className="w-5 h-5" />
        </button>
        
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="搜索节点..."
          className={`w-full px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500 border-y border-r border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-r`}
        />
        
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            aria-label="清除搜索"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* 搜索结果 */}
      {results.length > 0 && (
        <div className="search-results absolute z-50 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg max-h-64 overflow-y-auto">
          <ul>
            {results.map(result => (
              <li 
                key={result.id}
                onClick={() => handleResultClick(result.id)}
                className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
              >
                <div className="font-medium truncate dark:text-gray-200">{result.label || "未命名节点"}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  匹配: {result.matchType === 'label' ? '标签' : 
                     result.matchType === 'description' ? '描述' : 
                     '网址'}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchBox; 
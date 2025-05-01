import React, { useState } from 'react';
import { ReactFlowInstance } from '@xyflow/react';
import { NodeDataType } from '../types';
import { exportFlowToJson, importFlowFromJson } from '../utils/jsonUtils';
import { Bars3Icon, XMarkIcon, ArrowUturnLeftIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import ThemeToggle from './ThemeToggle';

interface ToolbarProps {
  onAddNode: (type: NodeDataType['type']) => void;
  onLayout: () => void;
  rfInstance: ReactFlowInstance | null;
  setNodes: React.Dispatch<React.SetStateAction<any>>;
  setEdges: React.Dispatch<React.SetStateAction<any>>;
  onSave?: () => void;
  onClearSaved?: () => void;
  autoSaveEnabled?: boolean;
  onToggleAutoSave?: () => void;
  lastSavedTime?: string;
  toggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  exportHtmlButton?: React.ReactNode;
  onUndo?: () => void;
  canUndo?: boolean;
  exportImageButton?: React.ReactNode;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onAddNode,
  onLayout,
  rfInstance,
  setNodes,
  setEdges,
  onSave,
  onClearSaved,
  autoSaveEnabled = true,
  onToggleAutoSave,
  lastSavedTime = '未保存',
  toggleSidebar,
  isSidebarOpen = false,
  exportHtmlButton,
  onUndo,
  canUndo = false,
  exportImageButton,
}) => {
  const [jsonVisible, setJsonVisible] = useState(false);
  const [jsonText, setJsonText] = useState('');
  
  // 添加URL状态和加载状态
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 处理导出
  const handleExport = () => {
    const jsonData = exportFlowToJson(rfInstance);
    if (jsonData) {
      setJsonText(jsonData);
      setJsonVisible(true);
    } else {
      alert('导出失败，请确保流程图不为空');
    }
  };

  // 处理导入
  const handleImport = () => {
    setJsonVisible(true);
    setJsonText('');
  };

  // 应用导入的JSON
  const applyImport = () => {
    try {
      const flowData = importFlowFromJson(jsonText);
      if (flowData) {
        setNodes(flowData.nodes);
        setEdges(flowData.edges);
        
        // 更新视图
        if (rfInstance) {
          rfInstance.setViewport(flowData.viewport);
        }
        
        setJsonVisible(false);
      }
    } catch (error) {
      console.error('应用导入的JSON时出错:', error);
      alert('导入失败，请检查JSON格式是否正确');
    }
  };
  
  // 处理从URL生成
  const handleGenerateFromUrl = async () => {
    if (!url.trim()) {
      setErrorMessage('请输入有效的URL');
      return;
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setUrl(`https://${url}`);
    }
    
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      // 1. 调用爬虫API
      const crawlResponse = await fetch('http://localhost:5000/api/crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      
      if (!crawlResponse.ok) {
        const errorData = await crawlResponse.json();
        throw new Error(errorData.message || '爬取页面失败');
      }
      
      const crawlData = await crawlResponse.json();
      
      // 2. 调用内容处理API
      const extractResponse = await fetch('http://localhost:5000/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content: crawlData.content,
          title: crawlData.title
        }),
      });
      
      if (!extractResponse.ok) {
        const errorData = await extractResponse.json();
        throw new Error(errorData.message || '处理内容失败');
      }
      
      const { nodes, edges } = await extractResponse.json();
      
      // 3. 更新流程图
      setNodes(nodes);
      setEdges(edges);
      
      // 4. 重新居中视图
      if (rfInstance) {
        setTimeout(() => {
          rfInstance.fitView({ padding: 0.2 });
        }, 100);
      }
      
    } catch (error) {
      console.error('从URL生成流程图时出错:', error);
      setErrorMessage(error instanceof Error ? error.message : '未知错误');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理高级生成
  const handleAdvancedGenerateFromUrl = async () => {
    if (!url.trim()) {
      setErrorMessage('请输入有效的URL');
      return;
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setUrl(`https://${url}`);
    }
    
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      // 1. 调用爬虫API - 与基本生成相同
      const crawlResponse = await fetch('http://localhost:5000/api/crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      
      if (!crawlResponse.ok) {
        const errorData = await crawlResponse.json();
        throw new Error(errorData.message || '爬取页面失败');
      }
      
      const crawlData = await crawlResponse.json();
      
      // 2. 调用高级内容处理API
      const extractResponse = await fetch('http://localhost:5000/api/extract-advanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content: crawlData.content,
          title: crawlData.title,
          originalUrl: url, // 传递原始URL，以备后端需要进一步抓取HTML
          structuredContent: crawlData.structuredContent // 传递爬虫获得的结构化内容
        }),
      });
      
      if (!extractResponse.ok) {
        const errorData = await extractResponse.json();
        throw new Error(errorData.message || '高级处理内容失败');
      }
      
      const { nodes, edges } = await extractResponse.json();
      
      // 3. 更新流程图
      setNodes(nodes);
      setEdges(edges);
      
      // 4. 重新居中视图
      if (rfInstance) {
        setTimeout(() => {
          rfInstance.fitView({ padding: 0.2 });
        }, 100);
      }
      
    } catch (error) {
      console.error('从URL生成高级流程图时出错:', error);
      setErrorMessage(error instanceof Error ? error.message : '未知错误');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          {onUndo && (
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`px-3 py-1 flex items-center space-x-1 ${
                canUndo 
                  ? 'bg-indigo-500 text-white hover:bg-indigo-600' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              } rounded`}
              title="撤销上一步操作"
            >
              <ArrowUturnLeftIcon className="w-4 h-4" />
              <span>撤销</span>
            </button>
          )}
          <button
            onClick={() => onAddNode('typeA')}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            添加蓝色节点
          </button>
          <button
            onClick={() => onAddNode('typeB')}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            添加绿色节点
          </button>
          <button
            onClick={() => onAddNode('typeC')}
            className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
          >
            添加黄色节点
          </button>
          <button
            onClick={onLayout}
            className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
          >
            自动布局
          </button>
          
          {/* URL输入和生成按钮 */}
          <div className="flex items-center ml-4 space-x-1">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="输入URL..."
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-l focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 text-sm w-48"
              disabled={isLoading}
            />
            <button
              onClick={handleAdvancedGenerateFromUrl}
              disabled={isLoading}
              className={`px-3 py-1 flex items-center ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-purple-500 hover:bg-purple-600'
              } text-white transition-colors rounded-none`}
              title="从URL生成基础结构化流程图"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>生成中...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                    <path d="M2 17l10 5 10-5"></path>
                    <path d="M2 12l10 5 10-5"></path>
                  </svg>
                  <span>结构生成</span>
                </>
              )}
            </button>
            <button
              onClick={handleGenerateFromUrl}
              disabled={isLoading}
              className={`px-3 py-1 rounded-r flex items-center ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white transition-colors`}
              title="从URL生成高级流程图 (用于AI处理)"
            >
              {isLoading ? (
                <span>生成中...</span>
              ) : (
                <>
                  <GlobeAltIcon className="w-4 h-4 mr-1" />
                  <span>智能处理</span>
                </>
              )}
            </button>
          </div>
          
          {/* 错误消息 */}
          {errorMessage && (
            <div className="text-red-500 text-sm ml-2">{errorMessage}</div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {onSave && (
            <button
              onClick={onSave}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              title="手动保存当前流程图"
            >
              保存
            </button>
          )}
          {autoSaveEnabled !== undefined && onToggleAutoSave && (
            <button
              onClick={onToggleAutoSave}
              className={`px-3 py-1 ${
                autoSaveEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'
              } rounded hover:bg-opacity-80`}
              title={autoSaveEnabled ? '自动保存已开启' : '自动保存已关闭'}
            >
              {autoSaveEnabled ? '自动保存：开' : '自动保存：关'}
            </button>
          )}
          {onClearSaved && (
            <button
              onClick={onClearSaved}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              title="清除本地存储的流程图数据"
            >
              清除数据
            </button>
          )}
          {lastSavedTime && (
            <span className="text-xs text-gray-500">
              {lastSavedTime}
            </span>
          )}
          <div className="border-l border-gray-300 h-6 mx-1"></div>
          <span className="text-xs text-gray-500 hidden md:inline-block">
            提示: 选中元素后按Delete键可删除
          </span>
          <div className="border-l border-gray-300 h-6 mx-1"></div>
          {exportHtmlButton}
          {exportImageButton}
          <button
            onClick={handleExport}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            导出JSON
          </button>
          <button
            onClick={handleImport}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            导入JSON
          </button>
          {toggleSidebar && (
            <button
              onClick={() => {
                console.log('切换侧边栏按钮被点击');
                toggleSidebar();
              }}
              className={`p-2 rounded ${
                isSidebarOpen 
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
              title={isSidebarOpen ? '关闭侧边栏' : '打开侧边栏'}
            >
              {isSidebarOpen ? (
                <XMarkIcon className="w-5 h-5" />
              ) : (
                <Bars3Icon className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* JSON导入/导出模态框 */}
      {jsonVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg w-3/4 max-w-3xl">
            <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100">
              {jsonText ? '导出JSON' : '导入JSON'}
            </h3>
            <textarea
              className="w-full h-64 p-2 border rounded font-mono text-sm dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder={
                jsonText ? '' : '粘贴JSON数据到这里...'
              }
            />
            <div className="flex justify-end mt-4 space-x-2">
              <button
                onClick={() => setJsonVisible(false)}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
              {jsonText ? (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(jsonText);
                    alert('已复制到剪贴板');
                  }}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  复制
                </button>
              ) : (
                <button
                  onClick={applyImport}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  导入
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Toolbar; 
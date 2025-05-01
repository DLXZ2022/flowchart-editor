import React, { useState } from 'react';
import { ReactFlowInstance } from '@xyflow/react';
import type { NodeDataType } from '../types';
import { exportFlowToJson, importFlowFromJson } from '../utils/jsonUtils';
import { 
  Bars3Icon, 
  XMarkIcon, 
  ArrowUturnLeftIcon, 
  GlobeAltIcon, 
  PlusIcon,
  ServerIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  TrashIcon,
  CloudArrowDownIcon,
  CloudArrowUpIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import ThemeToggle from './ThemeToggle';

// 自定义图标
const ArrangeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" />
  </svg>
);

const SaveIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
  </svg>
);

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

// 按钮组件，提供统一的样式
interface ToolbarButtonProps {
  onClick: () => void;
  className?: string;
  title?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  onClick,
  className = "",
  title,
  disabled = false,
  icon,
  children
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1.5 rounded flex items-center space-x-1.5 transition-all ${
        disabled 
          ? 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400' 
          : 'hover:bg-opacity-80 active:scale-95 ' + className
      }`}
      title={title}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};

// 按钮组分隔
const ToolbarGroup: React.FC<{
  title?: string;
  children: React.ReactNode;
}> = ({ title, children }) => {
  return (
    <div className="flex flex-col">
      {title && (
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 px-1">
          {title}
        </div>
      )}
      <div className="flex items-center space-x-1.5">
        {children}
      </div>
    </div>
  );
};

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
  
  // 添加节点面板状态
  const [addPanelOpen, setAddPanelOpen] = useState(false);

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

  // 添加节点按钮点击
  const handleAddNodeClick = () => {
    setAddPanelOpen(!addPanelOpen);
  };

  return (
    <div className="p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
      <div className="flex flex-wrap items-center justify-between gap-y-2">
        {/* 左侧工具组 */}
        <div className="flex items-center space-x-3">
          {/* 编辑操作组 */}
          <ToolbarGroup title="编辑操作">
            {onUndo && (
              <ToolbarButton
                onClick={onUndo}
                disabled={!canUndo}
                className={canUndo ? 'bg-indigo-500 text-white' : ''}
                title="撤销上一步操作"
                icon={<ArrowUturnLeftIcon />}
              >
                撤销
              </ToolbarButton>
            )}
            
            {/* 添加节点下拉按钮 */}
            <div className="relative">
              <ToolbarButton
                onClick={handleAddNodeClick}
                className="bg-green-500 text-white"
                title="添加新节点"
                icon={<PlusIcon />}
              >
                添加节点
              </ToolbarButton>
              
              {addPanelOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 p-2 min-w-[150px] z-10 animate-fadeIn">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-2">
                    选择节点类型
                  </div>
                  <button
                    onClick={() => { onAddNode('typeA'); setAddPanelOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded flex items-center text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <div className="w-4 h-4 mr-2 rounded-full bg-blue-500"></div>
                    标题节点
                  </button>
                  <button
                    onClick={() => { onAddNode('typeB'); setAddPanelOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded flex items-center text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                  >
                    <div className="w-4 h-4 mr-2 rounded-full bg-green-500"></div>
                    内容节点
                  </button>
                  <button
                    onClick={() => { onAddNode('typeC'); setAddPanelOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded flex items-center text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                  >
                    <div className="w-4 h-4 mr-2 rounded-full bg-yellow-500"></div>
                    列表节点
                  </button>
                </div>
              )}
            </div>
            
            <ToolbarButton
              onClick={onLayout}
              className="bg-purple-500 text-white"
              title="自动排列节点位置"
              icon={<ArrangeIcon className="w-4 h-4" />}
            >
              自动布局
            </ToolbarButton>
          </ToolbarGroup>
          
          <div className="h-8 border-l border-gray-300 dark:border-gray-600"></div>
          
          {/* URL生成组 */}
          <ToolbarGroup title="从URL生成">
            <div className="flex items-center">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="输入URL..."
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-l focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 text-sm w-56 transition-all"
                disabled={isLoading}
              />
              <ToolbarButton
                onClick={handleAdvancedGenerateFromUrl}
                disabled={isLoading}
                className="bg-purple-500 text-white rounded-none"
                title="从URL生成结构化流程图"
                icon={isLoading ? (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <ServerIcon />
                )}
              >
                结构生成
              </ToolbarButton>
              <ToolbarButton
                onClick={handleGenerateFromUrl}
                disabled={isLoading}
                className="bg-blue-500 text-white rounded-r"
                title="从URL生成智能处理的流程图"
                icon={isLoading ? (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <GlobeAltIcon />
                )}
              >
                智能处理
              </ToolbarButton>
            </div>
            
            {/* 错误消息 */}
            {errorMessage && (
              <div className="text-red-500 text-sm ml-2 animate-fadeIn">{errorMessage}</div>
            )}
          </ToolbarGroup>
        </div>
        
        {/* 右侧工具组 */}
        <div className="flex items-center space-x-3">
          {/* 文件操作 */}
          <ToolbarGroup title="文件操作">
            {onSave && (
              <ToolbarButton
                onClick={onSave}
                className="bg-green-600 text-white"
                title="手动保存当前流程图"
                icon={<SaveIcon className="w-4 h-4" />}
              >
                保存
              </ToolbarButton>
            )}
            
            {autoSaveEnabled !== undefined && onToggleAutoSave && (
              <ToolbarButton
                onClick={onToggleAutoSave}
                className={autoSaveEnabled ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}
                title={autoSaveEnabled ? '自动保存已开启' : '自动保存已关闭'}
                icon={<AdjustmentsHorizontalIcon />}
              >
                {autoSaveEnabled ? '自动:开' : '自动:关'}
              </ToolbarButton>
            )}
            
            {lastSavedTime && (
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                {lastSavedTime}
              </span>
            )}
            
            {onClearSaved && (
              <ToolbarButton
                onClick={onClearSaved}
                className="bg-red-600 text-white"
                title="清除本地存储的流程图数据"
                icon={<TrashIcon />}
              >
                清除数据
              </ToolbarButton>
            )}
          </ToolbarGroup>
          
          <div className="h-8 border-l border-gray-300 dark:border-gray-600"></div>
          
          {/* 导出工具 */}
          <ToolbarGroup title="导出工具">
            {exportHtmlButton}
            {exportImageButton}
            <ToolbarButton
              onClick={handleExport}
              className="bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
              title="导出为JSON格式"
              icon={<CloudArrowUpIcon />}
            >
              导出JSON
            </ToolbarButton>
            <ToolbarButton
              onClick={handleImport}
              className="bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
              title="从JSON导入"
              icon={<CloudArrowDownIcon />}
            >
              导入JSON
            </ToolbarButton>
          </ToolbarGroup>
          
          <div className="h-8 border-l border-gray-300 dark:border-gray-600 mr-1"></div>
          
          {/* 其他工具 */}
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            
            {toggleSidebar && (
              <button
                onClick={() => {
                  console.log('切换侧边栏按钮被点击');
                  toggleSidebar();
                }}
                className={`p-2 rounded transition-colors ${
                  isSidebarOpen 
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30' 
                    : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
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
      </div>

      {/* 小屏幕提示 */}
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center md:hidden">
        提示: 选中元素后按Delete键可删除
      </div>

      {/* JSON导入/导出模态框 */}
      {jsonVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg w-3/4 max-w-3xl">
            <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100">
              {jsonText ? '导出JSON' : '导入JSON'}
            </h3>
            <textarea
              className="w-full h-64 p-2 border rounded font-mono text-sm dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder={
                jsonText ? '' : '粘贴JSON数据到这里...'
              }
            />
            <div className="flex justify-end mt-4 space-x-2">
              <button
                onClick={() => setJsonVisible(false)}
                className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
              {jsonText ? (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(jsonText);
                    alert('已复制到剪贴板');
                  }}
                  className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  复制
                </button>
              ) : (
                <button
                  onClick={applyImport}
                  className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
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
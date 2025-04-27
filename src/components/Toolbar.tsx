import React, { useState } from 'react';
import { ReactFlowInstance } from '@xyflow/react';
import { NodeDataType } from '../types';
import { exportFlowToJson, importFlowFromJson } from '../utils/jsonUtils';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

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
}) => {
  const [jsonVisible, setJsonVisible] = useState(false);
  const [jsonText, setJsonText] = useState('');

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

  return (
    <div className="p-4 bg-white border-b shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={() => onAddNode('typeA')}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            添加蓝色节点
          </button>
          <button
            onClick={() => onAddNode('typeB')}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          >
            添加绿色节点
          </button>
          <button
            onClick={() => onAddNode('typeC')}
            className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            添加黄色节点
          </button>
          <button
            onClick={onLayout}
            className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            自动布局
          </button>
        </div>
        <div className="flex items-center space-x-2">
          {onSave && (
            <button
              onClick={onSave}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
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
          {exportHtmlButton}
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
          <div className="bg-white p-4 rounded-lg shadow-lg w-3/4 max-w-3xl">
            <h3 className="text-lg font-bold mb-2">
              {jsonText ? '导出JSON' : '导入JSON'}
            </h3>
            <textarea
              className="w-full h-64 p-2 border rounded font-mono text-sm"
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder={
                jsonText ? '' : '粘贴JSON数据到这里...'
              }
            />
            <div className="flex justify-end mt-4 space-x-2">
              <button
                onClick={() => setJsonVisible(false)}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                取消
              </button>
              {jsonText ? (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(jsonText);
                    alert('已复制到剪贴板');
                  }}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  复制
                </button>
              ) : (
                <button
                  onClick={applyImport}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
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
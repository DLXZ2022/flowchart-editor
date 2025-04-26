import React, { useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { exportFlowchartToHtml } from '../utils/exportToHtml';
import { FlowchartNode, FlowchartEdge } from '../types';

interface ExportHtmlButtonProps {
  className?: string;
}

const ExportHtmlButton: React.FC<ExportHtmlButtonProps> = ({ className }) => {
  const [title, setTitle] = useState<string>('流程图');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const { getNodes, getEdges } = useReactFlow();

  const handleExport = () => {
    const nodes = getNodes() as FlowchartNode[];
    const edges = getEdges() as FlowchartEdge[];
    
    // 如果没有节点，显示提示
    if (nodes.length === 0) {
      alert('流程图为空，请先添加节点');
      return;
    }
    
    // 打开模态框
    setIsModalOpen(true);
  };
  
  const handleConfirmExport = () => {
    const nodes = getNodes() as FlowchartNode[];
    const edges = getEdges() as FlowchartEdge[];
    
    // 导出为HTML
    exportFlowchartToHtml(
      nodes,
      edges,
      title,
      { urlValidator: /^https?:\/\// } // 只允许http和https开头的URL
    );
    
    // 关闭模态框
    setIsModalOpen(false);
  };

  return (
    <>
      <button 
        onClick={handleExport}
        className={`px-3 py-2 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700 transition-colors ${className || ''}`}
      >
        导出HTML
      </button>
      
      {/* 导出选项模态框 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-medium mb-4">导出流程图</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标题:
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded border border-gray-300"
                placeholder="流程图标题"
              />
            </div>
            
            <div className="text-xs text-gray-500 mb-4">
              提示：导出的HTML文件可以脱离本应用独立运行，节点URL将在新标签页打开。
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                取消
              </button>
              <button
                onClick={handleConfirmExport}
                className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                导出
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExportHtmlButton; 
import React, { useEffect, useState } from 'react';
import { exportFlowchartToHtml } from '../utils/exportToHtml';
import { useReactFlow } from '@xyflow/react';
import { FlowchartNode, FlowchartEdge } from '../types';

interface ExportHtmlButtonProps {
  className?: string;
  sidebarContent?: string;
}

const ExportHtmlButton: React.FC<ExportHtmlButtonProps> = ({ 
  className = '', 
  sidebarContent = '' 
}) => {
  const { getNodes, getEdges, getViewport } = useReactFlow();
  const instance = useReactFlow();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // 检测当前主题模式
  useEffect(() => {
    // 首先检查HTML元素的类名
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);

    // 监听主题变化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark');
          setIsDarkMode(isDark);
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    
    return () => observer.disconnect();
  }, []);

  const handleExport = async () => {
    const nodes = getNodes() as FlowchartNode[];
    const edges = getEdges() as FlowchartEdge[];
    
    if (nodes.length === 0) {
      alert('无节点可导出');
      return;
    }
    
    await exportFlowchartToHtml(nodes, edges, instance, '流程图', {
      sidebarContent,
      darkMode: isDarkMode
    });
  };

  return (
    <button
      onClick={handleExport}
      className={`px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 ${className}`}
    >
      导出HTML
    </button>
  );
};

export default ExportHtmlButton; 
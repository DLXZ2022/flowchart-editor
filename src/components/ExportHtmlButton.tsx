import React from 'react';
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

  const handleExport = async () => {
    const nodes = getNodes() as FlowchartNode[];
    const edges = getEdges() as FlowchartEdge[];
    
    if (nodes.length === 0) {
      alert('无节点可导出');
      return;
    }
    
    await exportFlowchartToHtml(nodes, edges, instance, '流程图', {
      sidebarContent
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
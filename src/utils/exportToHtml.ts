import { FlowchartNode, FlowchartEdge, NodeDataType } from '../types';
import ReactDOMServer from 'react-dom/server';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { ReactFlowInstance } from '@xyflow/react';

// 数据转换接口
interface ExportNode {
  id: string;
  position: [number, number];
  label: string;
  url?: string;
  color: string;
}

interface ExportEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
}

interface ExportData {
  nodes: ExportNode[];
  edges: ExportEdge[];
}

// URL安全验证
const isValidUrl = (url?: string, pattern?: RegExp): boolean => {
  if (!url) return false;
  
  // 默认URL验证模式
  const defaultPattern = /^https?:\/\/[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;
  
  // 使用提供的模式或默认模式
  const validator = pattern || defaultPattern;
  return validator.test(url);
};

// 获取节点颜色
const getNodeColor = (type: string): string => {
  switch (type) {
    case 'typeA':
      return '#3b82f6'; // blue-500
    case 'typeB':
      return '#10b981'; // green-500
    case 'typeC':
      return '#f59e0b'; // yellow-500
    default:
      return '#6b7280'; // gray-500
  }
};

// 转换函数
export const transformToExportFormat = (
  nodes: FlowchartNode[],
  edges: FlowchartEdge[],
  options?: { urlValidator?: RegExp }
): ExportData => {
  // 转换节点
  const exportNodes: ExportNode[] = nodes.map(node => {
    const nodeData = node.data as NodeDataType;
    
    return {
      id: node.id,
      position: [node.position.x, node.position.y],
      label: nodeData.label,
      // 仅在URL有效时添加
      ...(isValidUrl(nodeData.url, options?.urlValidator) && { url: nodeData.url }),
      color: getNodeColor(nodeData.type),
    };
  });

  // 转换边
  const exportEdges: ExportEdge[] = edges.map(edge => ({
    id: edge.id,
    from: edge.source,
    to: edge.target,
    ...(edge.data?.label && { label: edge.data.label }),
  }));

  return { nodes: exportNodes, edges: exportEdges };
};

// 导出为HTML文件
export const exportFlowchartToHtml = async (
  nodes: FlowchartNode[],
  edges: FlowchartEdge[],
  rfInstance: ReactFlowInstance,
  title: string = '流程图',
  options?: { 
    sidebarContent?: string
  }
): Promise<void> => {
  try {
    // 如果有侧边栏内容，渲染为HTML
    let sidebarHtml = '';
    if (options?.sidebarContent) {
      // 使用React.createElement渲染Markdown为HTML
      const markdownElement = React.createElement(ReactMarkdown, null, options.sidebarContent);
      const markdownHtml = ReactDOMServer.renderToStaticMarkup(markdownElement);
      sidebarHtml = `
        <div id="sidebar">
          <div class="sidebar-header">
            <h2>${title} - 说明文档</h2>
          </div>
          <div class="sidebar-content">
            ${markdownHtml}
          </div>
        </div>
      `;
    }
    
    // 获取当前视口位置
    const { x, y, zoom } = rfInstance.getViewport();
    
    // 构建节点HTML
    const nodesHtml = nodes.map(node => {
      // 转换位置到视口坐标
      const translateX = node.position.x;
      const translateY = node.position.y;
      
      // 获取节点数据和样式
      const data = node.data;
      let color = '#3b82f6'; // 默认蓝色
      
      // 基于节点类型设置颜色
      if (data.type === 'typeA') color = '#3b82f6'; // 蓝色
      else if (data.type === 'typeB') color = '#10b981'; // 绿色
      else if (data.type === 'typeC') color = '#f59e0b'; // 黄色
      
      // 构建节点HTML
      const nodeClickAttr = data.url 
        ? `onclick="window.open('${data.url}', '_blank')" style="cursor: pointer;"` 
        : '';
      
      return `
        <div 
          class="node" 
          id="node-${node.id}" 
          style="
            left: ${translateX}px; 
            top: ${translateY}px; 
            background-color: ${color};
          "
          data-id="${node.id}"
          data-node-type="${data.type || ''}"
          ${nodeClickAttr}
        >
          <div class="node-label">${data.label || ''}</div>
        </div>
      `;
    }).join('\n');
    
    // 构建边HTML
    const edgesHtml = edges.map(edge => {
      // 获取源节点和目标节点
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);
      
      if (!source || !target) return '';
      
      // 获取连接点的句柄ID和位置
      const sourceHandleId = edge.sourceHandle || '';
      const targetHandleId = edge.targetHandle || '';
      
      // 解析Handle ID格式: 'direction-index-type'
      const sourceHandleInfo = sourceHandleId ? sourceHandleId.split('-') : [];
      const targetHandleInfo = targetHandleId ? targetHandleId.split('-') : [];
      
      // 获取源节点和目标节点的默认中心位置
      let sourceX = source.position.x + 75; // 默认使用节点宽度的一半
      let sourceY = source.position.y + 30; // 默认使用节点高度的一半
      let targetX = target.position.x + 75;
      let targetY = target.position.y + 30;
      
      // 节点宽高
      const nodeWidth = 150;
      const nodeHeight = 60;
      
      // 如果有指定的连接点，则计算连接点的位置
      if (sourceHandleInfo.length >= 2) {
        const [direction, index] = sourceHandleInfo;
        // 使用类型安全的方式获取handleCounts
        let handleCounts = 1;
        if (direction === 'top') handleCounts = source.data.handleCounts?.top || 1;
        else if (direction === 'bottom') handleCounts = source.data.handleCounts?.bottom || 1;
        else if (direction === 'left') handleCounts = source.data.handleCounts?.left || 1;
        else if (direction === 'right') handleCounts = source.data.handleCounts?.right || 1;
        
        const handleIndex = parseInt(index, 10);
        const percentage = (handleIndex + 1) * 100 / (handleCounts + 1) / 100;
        
        switch (direction) {
          case 'top':
            sourceX = source.position.x + nodeWidth * percentage;
            sourceY = source.position.y;
            break;
          case 'bottom':
            sourceX = source.position.x + nodeWidth * percentage;
            sourceY = source.position.y + nodeHeight;
            break;
          case 'left':
            sourceX = source.position.x;
            sourceY = source.position.y + nodeHeight * percentage;
            break;
          case 'right':
            sourceX = source.position.x + nodeWidth;
            sourceY = source.position.y + nodeHeight * percentage;
            break;
        }
      }
      
      if (targetHandleInfo.length >= 2) {
        const [direction, index] = targetHandleInfo;
        // 使用类型安全的方式获取handleCounts
        let handleCounts = 1;
        if (direction === 'top') handleCounts = target.data.handleCounts?.top || 1;
        else if (direction === 'bottom') handleCounts = target.data.handleCounts?.bottom || 1;
        else if (direction === 'left') handleCounts = target.data.handleCounts?.left || 1;
        else if (direction === 'right') handleCounts = target.data.handleCounts?.right || 1;
        
        const handleIndex = parseInt(index, 10);
        const percentage = (handleIndex + 1) * 100 / (handleCounts + 1) / 100;
        
        switch (direction) {
          case 'top':
            targetX = target.position.x + nodeWidth * percentage;
            targetY = target.position.y;
            break;
          case 'bottom':
            targetX = target.position.x + nodeWidth * percentage;
            targetY = target.position.y + nodeHeight;
            break;
          case 'left':
            targetX = target.position.x;
            targetY = target.position.y + nodeHeight * percentage;
            break;
          case 'right':
            targetX = target.position.x + nodeWidth;
            targetY = target.position.y + nodeHeight * percentage;
            break;
        }
      }
      
      // 计算控制点，创建平滑的曲线
      let controlPoint1X, controlPoint1Y, controlPoint2X, controlPoint2Y;
      
      // 基于连接点的方向设置控制点
      const sourceDir = sourceHandleInfo.length >= 1 ? sourceHandleInfo[0] : 'bottom';
      const targetDir = targetHandleInfo.length >= 1 ? targetHandleInfo[0] : 'top';
      
      // 控制点偏移距离 - 根据连线长度动态调整
      const dx = Math.abs(targetX - sourceX);
      const dy = Math.abs(targetY - sourceY);
      const distance = Math.sqrt(dx * dx + dy * dy);
      const offset = Math.min(Math.max(distance * 0.25, 30), 150); // 最小30px，最大150px
      
      // 源节点控制点
      switch (sourceDir) {
        case 'top':
          controlPoint1X = sourceX;
          controlPoint1Y = sourceY - offset;
          break;
        case 'bottom':
          controlPoint1X = sourceX;
          controlPoint1Y = sourceY + offset;
          break;
        case 'left':
          controlPoint1X = sourceX - offset;
          controlPoint1Y = sourceY;
          break;
        case 'right':
          controlPoint1X = sourceX + offset;
          controlPoint1Y = sourceY;
          break;
        default:
          // 默认从底部出发
          controlPoint1X = sourceX;
          controlPoint1Y = sourceY + offset;
      }
      
      // 目标节点控制点
      switch (targetDir) {
        case 'top':
          controlPoint2X = targetX;
          controlPoint2Y = targetY - offset;
          break;
        case 'bottom':
          controlPoint2X = targetX;
          controlPoint2Y = targetY + offset;
          break;
        case 'left':
          controlPoint2X = targetX - offset;
          controlPoint2Y = targetY;
          break;
        case 'right':
          controlPoint2X = targetX + offset;
          controlPoint2Y = targetY;
          break;
        default:
          // 默认从顶部进入
          controlPoint2X = targetX;
          controlPoint2Y = targetY - offset;
      }
      
      // 创建三次贝塞尔曲线路径
      const pathData = `M${sourceX},${sourceY} C${controlPoint1X},${controlPoint1Y} ${controlPoint2X},${controlPoint2Y} ${targetX},${targetY}`;
      
      // 计算边标签位置（在路径中点附近）
      const labelX = (sourceX + targetX + controlPoint1X + controlPoint2X) / 4;
      const labelY = (sourceY + targetY + controlPoint1Y + controlPoint2Y) / 4;
      
      // 构建标签HTML
      const labelHtml = edge.data?.label 
        ? `<div class="edge-label" style="left: ${labelX}px; top: ${labelY}px;">${edge.data.label}</div>` 
        : '';
      
      // 返回边的HTML (作为SVG路径)
      return `
        <path 
          id="edge-${edge.id}" 
          class="edge" 
          d="${pathData}" 
          marker-end="url(#arrowhead)"
          data-source="${edge.source}"
          data-target="${edge.target}"
          data-source-handle="${sourceHandleId}"
          data-target-handle="${targetHandleId}"
        ></path>
        ${labelHtml}
      `;
    }).join('\n');
    
    // 创建完整的HTML
    const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-Frame-Options" content="DENY">
  <title>${title}</title>
  <style>
    body, html {
      height: 100%;
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      overflow: hidden;
    }
    .main-container {
      display: flex;
      width: 100%;
      height: 100vh;
    }
    #flowchart-container {
      width: ${options?.sidebarContent ? 'calc(100% - 300px)' : '100%'};
      height: 100%;
      background-color: #f9fafb;
      position: relative;
      overflow: hidden;
    }
    .header {
      position: absolute;
      top: 10px;
      left: 10px;
      z-index: 10;
      background-color: rgba(255, 255, 255, 0.8);
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 14px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    #flowchart-pane {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      overflow: visible;
      transition: transform 0.05s;
      transform-origin: 0 0;
    }
    .node {
      box-sizing: border-box;
      position: absolute;
      width: 150px;
      height: 60px;
      padding: 8px 10px;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      color: white;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      user-select: none;
      z-index: 2;
      transition: box-shadow 0.2s;
      overflow: visible;
    }
    .node:hover {
      box-shadow: 0 4px 10px rgba(0,0,0,0.5);
    }
    .node-label {
      width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .edge-container {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      z-index: 1;
      pointer-events: none;
      overflow: visible;
    }
    .edge {
      fill: none;
      stroke: #666;
      stroke-width: 2px;
      pointer-events: none;
      transition: stroke 0.3s, stroke-width 0.3s;
    }
    .edge-highlighted {
      stroke: #3b82f6;
      stroke-width: 3px;
      filter: drop-shadow(0 0 3px rgba(59, 130, 246, 0.5));
    }
    .edge-label {
      position: absolute;
      padding: 3px 6px;
      background-color: white;
      border-radius: 4px;
      font-size: 12px;
      transform: translate(-50%, -50%);
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      z-index: 1;
      pointer-events: none;
      transition: box-shadow 0.3s;
    }
    .node:hover + .edge-label {
      box-shadow: 0 2px 5px rgba(59, 130, 246, 0.4);
    }
    #sidebar {
      width: 300px;
      height: 100%;
      background-color: white;
      border-left: 1px solid #e5e7eb;
      box-shadow: -2px 0 5px rgba(0,0,0,0.05);
      overflow-y: auto;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
    }
    .sidebar-header {
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
      background-color: #f9fafb;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .sidebar-header h2 {
      margin: 0;
      font-size: 1.25rem;
      color: #374151;
      display: flex;
      align-items: center;
    }
    .sidebar-header h2:before {
      content: '📄';
      margin-right: 8px;
      font-size: 1.2em;
    }
    .sidebar-content {
      padding: 1rem;
      line-height: 1.6;
      color: #374151;
      font-size: 0.95rem;
      flex: 1;
    }
    .sidebar-content h1, .sidebar-content h2, .sidebar-content h3 {
      margin-top: 1.5rem;
      margin-bottom: 1rem;
      color: #111827;
      font-weight: 600;
    }
    .sidebar-content h1 {
      font-size: 1.5rem;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 0.5rem;
    }
    .sidebar-content h2 {
      font-size: 1.3rem;
      border-bottom: 1px solid #f3f4f6;
      padding-bottom: 0.3rem;
    }
    .sidebar-content h3 {
      font-size: 1.1rem;
    }
    .sidebar-content p {
      margin-bottom: 1rem;
    }
    .sidebar-content ul, .sidebar-content ol {
      margin-left: 1.5rem;
      margin-bottom: 1rem;
    }
    .sidebar-content li {
      margin-bottom: 0.5rem;
    }
    .sidebar-content a {
      color: #3b82f6;
      text-decoration: none;
    }
    .sidebar-content a:hover {
      text-decoration: underline;
    }
    .sidebar-content code {
      background-color: #f3f4f6;
      padding: 0.2rem 0.4rem;
      border-radius: 0.25rem;
      font-family: monospace;
      font-size: 0.9em;
    }
    .sidebar-content pre {
      background-color: #f3f4f6;
      padding: 1rem;
      border-radius: 0.25rem;
      overflow-x: auto;
      margin-bottom: 1rem;
      border: 1px solid #e5e7eb;
    }
    .sidebar-content pre code {
      background-color: transparent;
      padding: 0;
      display: block;
    }
    .sidebar-content blockquote {
      border-left: 4px solid #3b82f6;
      padding-left: 1rem;
      margin-left: 0;
      margin-right: 0;
      font-style: italic;
      color: #4b5563;
      background-color: #f9fafb;
      padding: 0.5rem 1rem;
      border-radius: 0 0.25rem 0.25rem 0;
    }
    .sidebar-content table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1rem;
    }
    .sidebar-content th, .sidebar-content td {
      border: 1px solid #e5e7eb;
      padding: 0.5rem;
    }
    .sidebar-content th {
      background-color: #f9fafb;
      font-weight: 600;
    }
    .sidebar-content tr:nth-child(even) {
      background-color: #f9fafb;
    }
    .sidebar-content img {
      max-width: 100%;
      height: auto;
      border-radius: 0.25rem;
      margin: 1rem 0;
    }
    .sidebar-content hr {
      border: 0;
      border-top: 1px solid #e5e7eb;
      margin: 1.5rem 0;
    }
    .zoom-controls {
      position: absolute;
      bottom: 20px;
      right: 20px;
      background: white;
      border-radius: 4px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      display: flex;
      z-index: 100;
    }
    .zoom-button {
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      border: none;
      border-radius: 4px;
      font-size: 18px;
      cursor: pointer;
    }
    .zoom-button:hover {
      background: #f1f1f1;
    }
  </style>
</head>
<body>
  <div class="main-container">
    <div id="flowchart-container">
      <div class="header">${title}</div>
      <div id="flowchart-pane" style="transform: translate(${x}px, ${y}px) scale(${zoom});">
        <!-- 连线 -->
        <svg class="edge-container" width="100%" height="100%" style="position: absolute; overflow: visible; z-index: 1;">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
            </marker>
          </defs>
          ${edgesHtml}
        </svg>
        
        <!-- 节点 -->
        ${nodesHtml}
      </div>
      <div class="zoom-controls">
        <button class="zoom-button" id="zoom-in">+</button>
        <button class="zoom-button" id="zoom-out">−</button>
        <button class="zoom-button" id="zoom-reset">⟲</button>
      </div>
    </div>
    ${sidebarHtml}
  </div>
  <script>
    // 拖拽和缩放功能
    const container = document.getElementById('flowchart-container');
    const pane = document.getElementById('flowchart-pane');
    
    let scale = ${zoom};
    let translateX = ${x};
    let translateY = ${y};
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    
    // 应用变换
    function applyTransform() {
      pane.style.transform = \`translate(\${translateX}px, \${translateY}px) scale(\${scale})\`;
    }
    
    // 注册拖拽事件
    container.addEventListener('mousedown', (e) => {
      // 如果点击的是节点，不启动拖拽
      if (e.target.closest('.node')) {
        return;
      }
      
      isDragging = true;
      dragStartX = e.clientX - translateX;
      dragStartY = e.clientY - translateY;
      container.style.cursor = 'grabbing';
      e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      translateX = e.clientX - dragStartX;
      translateY = e.clientY - dragStartY;
      applyTransform();
    });
    
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        container.style.cursor = 'default';
      }
    });
    
    // 缩放功能
    document.getElementById('zoom-in').addEventListener('click', () => {
      scale *= 1.2;
      applyTransform();
    });
    
    document.getElementById('zoom-out').addEventListener('click', () => {
      scale /= 1.2;
      applyTransform();
    });
    
    document.getElementById('zoom-reset').addEventListener('click', () => {
      // 重置为最佳视图
      resetViewToFitAll();
    });
    
    // 添加鼠标滚轮缩放
    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      
      // 获取鼠标相对于容器的位置
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // 缩放前鼠标位置在画布坐标系中的位置
      const mouseBoxX = (mouseX - translateX) / scale;
      const mouseBoxY = (mouseY - translateY) / scale;
      
      // 计算新的缩放值
      const newScale = scale * delta;
      
      // 更新缩放值
      scale = newScale;
      
      // 计算新的平移值，保持鼠标位置不变
      translateX = mouseX - mouseBoxX * newScale;
      translateY = mouseY - mouseBoxY * newScale;
      
      applyTransform();
    }, { passive: false });
    
    // 函数：重置视图以适应所有节点
    function resetViewToFitAll() {
      const nodes = document.querySelectorAll('.node');
      if (nodes.length === 0) {
        scale = 1;
        translateX = 0;
        translateY = 0;
        applyTransform();
        return;
      }
      
      // 计算节点边界
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      
      nodes.forEach(node => {
        const left = parseInt(node.style.left);
        const top = parseInt(node.style.top);
        
        minX = Math.min(minX, left);
        minY = Math.min(minY, top);
        maxX = Math.max(maxX, left + 150); // 节点宽度
        maxY = Math.max(maxY, top + 60);  // 节点高度
      });
      
      // 添加边距
      const padding = 100; // 增加边距，确保连线完全可见
      minX -= padding;
      minY -= padding;
      maxX += padding;
      maxY += padding;
      
      // 计算容器尺寸
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      
      // 计算合适的缩放比例
      const contentWidth = maxX - minX;
      const contentHeight = maxY - minY;
      
      const scaleX = containerWidth / contentWidth;
      const scaleY = containerHeight / contentHeight;
      
      // 选择较小的缩放比例，确保内容完全可见
      scale = Math.min(scaleX, scaleY, 1.5); // 限制最大缩放
      
      // 计算中心点
      const contentCenterX = (minX + maxX) / 2;
      const contentCenterY = (minY + maxY) / 2;
      
      // 计算平移量，使内容居中
      translateX = containerWidth / 2 - contentCenterX * scale;
      translateY = containerHeight / 2 - contentCenterY * scale;
      
      applyTransform();
    }
    
    // 添加节点悬停效果
    document.querySelectorAll('.node').forEach(node => {
      node.addEventListener('mouseenter', () => {
        // 突出显示与该节点相关的连线
        const nodeId = node.getAttribute('data-id');
        if (nodeId) {
          document.querySelectorAll('path.edge').forEach(edge => {
            const source = edge.getAttribute('data-source');
            const target = edge.getAttribute('data-target');
            if (source === nodeId || target === nodeId) {
              edge.classList.add('edge-highlighted');
            }
          });
        }
      });
      
      node.addEventListener('mouseleave', () => {
        // 取消突出显示
        document.querySelectorAll('path.edge.edge-highlighted').forEach(edge => {
          edge.classList.remove('edge-highlighted');
        });
      });
    });
    
    // 在加载完成后自动调整视图
    document.addEventListener('DOMContentLoaded', function() {
      // 自动调整视图，确保所有节点可见
      setTimeout(resetViewToFitAll, 100);
    });
  </script>
</body>
</html>`;
    
    // 创建Blob
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const filename = `${title}-${timestamp}.html`;
    
    // 触发下载
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // 清理
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error('导出流程图时出错:', error);
    alert('导出失败: ' + (error instanceof Error ? error.message : String(error)));
  }
}; 
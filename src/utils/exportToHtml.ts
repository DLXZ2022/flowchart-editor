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
    sidebarContent?: string,
    darkMode?: boolean  // 添加深色模式选项
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
            transform: translate(0, 0);
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
    
    // 构建HTML内容，添加深色模式支持
    const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN" ${options?.darkMode ? 'class="dark"' : ''}>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-Frame-Options" content="DENY">
  <title>${title}</title>
  <style>
    /* 基础样式 */
    :root {
      --background-color: #ffffff;
      --text-color: #1f2937;
      --border-color: #e5e7eb;
      --header-bg: #f3f4f6;
      --sidebar-bg: #ffffff;
      --sidebar-border: #e5e7eb;
      --control-bg: #f3f4f6;
      --control-hover: #e5e7eb;
      --edge-color: #9ca3af;
      --edge-highlight: #3b82f6;
      --shadow-color: rgba(0, 0, 0, 0.1);
    }
    
    /* 深色模式变量 */
    html.dark {
      --background-color: #1f2937;
      --text-color: #f3f4f6;
      --border-color: #4b5563;
      --header-bg: #111827;
      --sidebar-bg: #111827;
      --sidebar-border: #374151;
      --control-bg: #374151;
      --control-hover: #4b5563;
      --edge-color: #6b7280;
      --edge-highlight: #60a5fa;
      --shadow-color: rgba(0, 0, 0, 0.5);
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--background-color);
      color: var(--text-color);
      transition: background-color 0.3s, color 0.3s;
    }
    
    .main-container {
      display: flex;
      width: 100%;
      height: 100vh;
    }
    
    /* 流程图容器 */
    #flowchart-container {
      flex: 1;
      position: relative;
      overflow: hidden;
      height: 100vh;
      background: var(--background-color);
      border-right: 1px solid var(--border-color);
    }
    
    .header {
      height: 50px;
      background: var(--header-bg);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      padding: 0 20px;
      font-size: 18px;
      font-weight: bold;
    }
    
    #flowchart-pane {
      width: 100%;
      height: calc(100% - 50px);
      transform-origin: top left;
      position: relative;
    }
    
    /* 节点和边样式 */
    .node {
      position: absolute;
      padding: 10px;
      border-radius: 6px;
      box-shadow: 0 2px 4px var(--shadow-color);
      width: 150px;
      min-height: 60px;
      color: white;
      transition: box-shadow 0.2s;
    }
    
    .node:hover {
      box-shadow: 0 4px 8px var(--shadow-color);
    }
    
    .node-label {
      font-weight: 500;
      margin-bottom: 5px;
    }
    
    .edge {
      stroke: var(--edge-color);
      stroke-width: 3px;
      fill: none;
    }
    
    .edge-highlighted {
      stroke: var(--edge-highlight);
      stroke-width: 4px;
    }
    
    .edge-text {
      fill: var(--text-color);
      font-size: 12px;
      font-weight: 500;
      pointer-events: none;
    }
    
    /* 侧边栏样式 */
    #sidebar {
      width: 300px;
      background: var(--sidebar-bg);
      border-left: 1px solid var(--sidebar-border);
      overflow-y: auto;
      height: 100vh;
      padding: 0;
      display: ${options?.sidebarContent ? 'block' : 'none'};
    }
    
    .sidebar-header {
      padding: 15px;
      border-bottom: 1px solid var(--border-color);
      background: var(--header-bg);
    }
    
    .sidebar-content {
      padding: 20px;
    }
    
    /* 为sidebar-content中的元素添加样式 */
    .sidebar-content h1, .sidebar-content h2, .sidebar-content h3 {
      margin-top: 0.8em;
      margin-bottom: 0.5em;
    }
    
    .sidebar-content p {
      margin-bottom: 1em;
      line-height: 1.5;
    }
    
    .sidebar-content ul, .sidebar-content ol {
      margin-left: 1.5em;
      margin-bottom: 1em;
    }
    
    .sidebar-content a {
      color: #3b82f6;
    }
    
    .sidebar-content code {
      background: #f1f5f9;
      padding: 2px 4px;
      border-radius: 3px;
      font-family: monospace;
    }
    
    html.dark .sidebar-content code {
      background: #374151;
    }
    
    .sidebar-content pre {
      background: #f1f5f9;
      padding: 10px;
      border-radius: 5px;
      overflow-x: auto;
      margin-bottom: 1em;
    }
    
    html.dark .sidebar-content pre {
      background: #374151;
    }
    
    /* 缩放控制 */
    .zoom-controls {
      position: absolute;
      bottom: 20px;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    
    .zoom-button {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 1px solid var(--border-color);
      background: var(--control-bg);
      color: var(--text-color);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      cursor: pointer;
    }
    
    .zoom-button:hover {
      background: var(--control-hover);
    }
    
    /* 深色模式切换按钮 */
    .theme-toggle {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 1px solid var(--border-color);
      background: var(--control-bg);
      color: var(--text-color);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      cursor: pointer;
      z-index: 10;
    }
    
    .theme-toggle:hover {
      background: var(--control-hover);
    }
  </style>
</head>
<body>
  <div class="main-container">
    <div id="flowchart-container">
      <div class="header">
        ${title}
        <button class="theme-toggle" id="theme-toggle" title="切换明暗模式">
          <span id="theme-icon">🌙</span>
        </button>
      </div>
      <div id="flowchart-pane" style="transform: translate(${x}px, ${y}px) scale(${zoom});">
        <!-- 连线 -->
        <svg class="edge-container" width="100%" height="100%" style="position: absolute; overflow: visible; z-index: 1;">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="var(--edge-color)" />
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
    
    // 深色模式切换
    const toggleTheme = () => {
      const html = document.documentElement;
      const themeIcon = document.getElementById('theme-icon');
      
      if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        themeIcon.textContent = '🌙';
        localStorage.setItem('theme', 'light');
      } else {
        html.classList.add('dark');
        themeIcon.textContent = '☀️';
        localStorage.setItem('theme', 'dark');
      }
    };
    
    // 绑定深色模式切换按钮事件
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    
    // 初始化主题图标
    document.getElementById('theme-icon').textContent = 
      document.documentElement.classList.contains('dark') ? '☀️' : '🌙';
    
    // 应用变换
    function applyTransform() {
      pane.style.transform = \`translate(\${translateX}px, \${translateY}px) scale(\${scale})\`;
    }
    
    // 注册拖拽事件
    container.addEventListener('mousedown', (e) => {
      // 如果点击的是节点或主题切换按钮，不启动拖拽
      if (e.target.closest('.node') || e.target.closest('.theme-toggle')) {
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
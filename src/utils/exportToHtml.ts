import { FlowchartNode, FlowchartEdge, NodeDataType } from '../types';

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

// 生成HTML模板
export const generateHtmlTemplate = (data: ExportData, title: string): string => {
  const jsonData = JSON.stringify(data);
  
  return `<!DOCTYPE html>
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
    }
    #flowchart-container {
      width: 100%;
      height: 100%;
      background-color: #f9fafb;
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
    /* 基本节点样式 */
    .node {
      box-sizing: border-box;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      position: absolute;
      word-wrap: break-word;
      text-align: center;
      transition: box-shadow 0.2s, transform 0.1s;
      cursor: pointer;
      min-width: 150px;
      min-height: 60px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      user-select: none;
      transform-origin: center;
    }
    .node:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      transform: translateY(-2px);
    }
    /* 连接线样式 */
    .edge {
      position: absolute;
      pointer-events: none;
      stroke: #666;
      stroke-width: 2px;
    }
    .edge-label {
      position: absolute;
      background-color: rgba(255,255,255,0.7);
      padding: 2px 4px;
      border-radius: 3px;
      font-size: 12px;
      pointer-events: none;
    }
    /* 箭头标记 */
    .arrow {
      fill: #666;
    }
  </style>
</head>
<body>
  <div class="header">${title}</div>
  <div id="flowchart-container"></div>
  
  <script>
    // 防止点击劫持
    if (window.self !== window.top) {
      window.top.location = window.self.location;
    }
    
    // 流程图数据
    const data = ${jsonData};
    
    // 简单流程图渲染器
    class SimpleFlowchart {
      constructor(containerId, data) {
        this.container = document.getElementById(containerId);
        this.nodes = data.nodes || [];
        this.edges = data.edges || [];
        this.svg = null;
        this.nodeElements = {};
        this.zoomLevel = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isDragging = false;
        this.lastX = 0;
        this.lastY = 0;
        
        // 初始化
        this.init();
      }
      
      init() {
        // 清空容器
        this.container.innerHTML = '';
        
        // 创建SVG用于绘制连接线
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.style.position = 'absolute';
        this.svg.style.top = '0';
        this.svg.style.left = '0';
        this.svg.style.width = '100%';
        this.svg.style.height = '100%';
        this.svg.style.pointerEvents = 'none';
        this.svg.setAttribute('class', 'edges-container');
        this.container.appendChild(this.svg);
        
        // 创建箭头标记定义
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', 'arrowhead');
        marker.setAttribute('markerWidth', '10');
        marker.setAttribute('markerHeight', '7');
        marker.setAttribute('refX', '10');
        marker.setAttribute('refY', '3.5');
        marker.setAttribute('orient', 'auto');
        
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
        polygon.setAttribute('class', 'arrow');
        marker.appendChild(polygon);
        defs.appendChild(marker);
        this.svg.appendChild(defs);
        
        // 渲染节点
        this.renderNodes();
        
        // 渲染连接
        this.renderEdges();
        
        // 添加事件监听
        this.setupEvents();
        
        // 初始调整视图
        this.fitView();
      }
      
      renderNodes() {
        this.nodes.forEach(node => {
          const nodeEl = document.createElement('div');
          nodeEl.setAttribute('class', 'node');
          nodeEl.setAttribute('data-id', node.id);
          nodeEl.setAttribute('data-url', node.url || '');
          nodeEl.style.backgroundColor = node.color;
          nodeEl.style.borderColor = node.color;
          
          // 设置初始位置 - 左上角
          nodeEl.style.left = (node.position[0] - 75) + 'px'; // 假设宽度150px的一半
          nodeEl.style.top = (node.position[1] - 30) + 'px'; // 假设高度60px的一半
          
          const labelEl = document.createElement('div');
          labelEl.textContent = node.label;
          nodeEl.appendChild(labelEl);
          
          this.container.appendChild(nodeEl);
          this.nodeElements[node.id] = nodeEl;
          
          // 添加点击事件
          nodeEl.addEventListener('click', () => {
            const url = nodeEl.getAttribute('data-url');
            if (url) {
              window.open(url.startsWith('http') ? url : 'https://' + url, '_blank', 'noopener,noreferrer');
            }
          });
        });
      }
      
      renderEdges() {
        // 清除现有连线和标签
        this.svg.querySelectorAll('.edge').forEach(edge => edge.remove());
        this.container.querySelectorAll('.edge-label').forEach(label => label.remove());
        
        this.edges.forEach(edge => {
          const sourceNode = this.nodeElements[edge.from];
          const targetNode = this.nodeElements[edge.to];
          
          if (!sourceNode || !targetNode) return;
          
          // 获取节点位置
          const sourceRect = sourceNode.getBoundingClientRect();
          const targetRect = targetNode.getBoundingClientRect();
          const containerRect = this.container.getBoundingClientRect();
          
          // 计算节点中心点
          const sourceX = sourceRect.left + sourceRect.width / 2 - containerRect.left;
          const sourceY = sourceRect.top + sourceRect.height / 2 - containerRect.top;
          const targetX = targetRect.left + targetRect.width / 2 - containerRect.left;
          const targetY = targetRect.top + targetRect.height / 2 - containerRect.top;
          
          // 计算连线起点和终点（节点边缘）
          const angle = Math.atan2(targetY - sourceY, targetX - sourceX);
          const sourceNodeRadius = Math.min(sourceRect.width, sourceRect.height) / 2;
          const targetNodeRadius = Math.min(targetRect.width, targetRect.height) / 2;
          
          const x1 = sourceX + Math.cos(angle) * sourceNodeRadius;
          const y1 = sourceY + Math.sin(angle) * sourceNodeRadius;
          const x2 = targetX - Math.cos(angle) * (targetNodeRadius + 10); // 箭头前稍微偏移，避免覆盖
          const y2 = targetY - Math.sin(angle) * (targetNodeRadius + 10);
          
          // 创建连接线
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', String(x1));
          line.setAttribute('y1', String(y1));
          line.setAttribute('x2', String(x2));
          line.setAttribute('y2', String(y2));
          line.setAttribute('class', 'edge');
          line.setAttribute('marker-end', 'url(#arrowhead)');
          this.svg.appendChild(line);
          
          // 如果有标签，添加标签
          if (edge.label) {
            const labelX = (x1 + x2) / 2;
            const labelY = (y1 + y2) / 2 - 10; // 稍微上移，避免覆盖线
            
            const labelEl = document.createElement('div');
            labelEl.setAttribute('class', 'edge-label');
            labelEl.textContent = edge.label;
            labelEl.style.left = labelX + 'px';
            labelEl.style.top = labelY + 'px';
            labelEl.style.transform = 'translate(-50%, -50%)'; // 居中
            this.container.appendChild(labelEl);
          }
        });
      }
      
      setupEvents() {
        // 拖动视图
        this.container.addEventListener('mousedown', (e) => {
          if (e.target === this.container) {
            this.isDragging = true;
            this.lastX = e.clientX;
            this.lastY = e.clientY;
            this.container.style.cursor = 'grabbing';
          }
        });
        
        document.addEventListener('mousemove', (e) => {
          if (this.isDragging) {
            const dx = e.clientX - this.lastX;
            const dy = e.clientY - this.lastY;
            this.offsetX += dx;
            this.offsetY += dy;
            this.lastX = e.clientX;
            this.lastY = e.clientY;
            this.updateTransform();
          }
        });
        
        document.addEventListener('mouseup', () => {
          this.isDragging = false;
          this.container.style.cursor = 'default';
        });
        
        // 缩放视图
        this.container.addEventListener('wheel', (e) => {
          e.preventDefault();
          const delta = e.deltaY > 0 ? -0.1 : 0.1;
          const newZoom = Math.max(0.5, Math.min(2, this.zoomLevel + delta));
          
          // 计算缩放中心点
          const rect = this.container.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          // 计算新的偏移量，保持鼠标位置不变
          this.offsetX = x - (x - this.offsetX) * (newZoom / this.zoomLevel);
          this.offsetY = y - (y - this.offsetY) * (newZoom / this.zoomLevel);
          
          this.zoomLevel = newZoom;
          this.updateTransform();
        });
        
        // 窗口大小变化时重新布局
        window.addEventListener('resize', () => {
          this.renderEdges();
        });
      }
      
      updateTransform() {
        Object.values(this.nodeElements).forEach(nodeEl => {
          const id = nodeEl.getAttribute('data-id');
          const node = this.nodes.find(n => n.id === id);
          
          if (!node) return;
          
          // 应用缩放和偏移
          const baseX = parseFloat(nodeEl.style.left);
          const baseY = parseFloat(nodeEl.style.top);
          
          const x = baseX * this.zoomLevel + this.offsetX;
          const y = baseY * this.zoomLevel + this.offsetY;
          
          nodeEl.style.transform = "translate(" + (x - baseX) + "px, " + (y - baseY) + "px) scale(" + this.zoomLevel + ")";
        });
        
        // 重新渲染连接线
        this.renderEdges();
      }
      
      fitView() {
        // 如果没有节点，直接返回
        if (this.nodes.length === 0) return;
        
        // 计算所有节点的范围
        let minX = Number.MAX_VALUE;
        let minY = Number.MAX_VALUE;
        let maxX = Number.MIN_VALUE;
        let maxY = Number.MIN_VALUE;
        
        this.nodes.forEach(node => {
          minX = Math.min(minX, node.position[0]);
          minY = Math.min(minY, node.position[1]);
          maxX = Math.max(maxX, node.position[0]);
          maxY = Math.max(maxY, node.position[1]);
        });
        
        // 添加边距
        minX -= 100;
        minY -= 100;
        maxX += 100;
        maxY += 100;
        
        // 计算宽高比
        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;
        const containerWidth = this.container.clientWidth;
        const containerHeight = this.container.clientHeight;
        
        console.log('节点范围:', {minX, minY, maxX, maxY});
        console.log('内容尺寸:', {contentWidth, contentHeight});
        console.log('容器尺寸:', {containerWidth, containerHeight});
        
        // 计算缩放比例，确保完全显示所有内容
        const scaleX = containerWidth / contentWidth;
        const scaleY = containerHeight / contentHeight;
        this.zoomLevel = Math.min(scaleX, scaleY, 1) * 0.9; // 额外缩小一点以确保有边距
        
        // 计算偏移量，使内容居中
        const contentCenterX = (minX + maxX) / 2;
        const contentCenterY = (minY + maxY) / 2;
        const containerCenterX = containerWidth / 2;
        const containerCenterY = containerHeight / 2;
        
        this.offsetX = containerCenterX - contentCenterX * this.zoomLevel;
        this.offsetY = containerCenterY - contentCenterY * this.zoomLevel;
        
        console.log('应用变换:', {zoom: this.zoomLevel, offsetX: this.offsetX, offsetY: this.offsetY});
        
        // 更新变换
        this.updateTransform();
      }
    }
    
    // 初始化流程图
    window.onload = function() {
      try {
        // 计算适合容器大小的初始缩放和位置
        setTimeout(() => {
          const flowchart = new SimpleFlowchart('flowchart-container', data);
          console.log('流程图初始化成功');
          console.log('节点数量:', data.nodes.length);
          console.log('连接数量:', data.edges.length);
          
          // 再次延迟调用fitView，确保DOM已完全渲染
          setTimeout(() => {
            flowchart.fitView();
          }, 100);
        }, 0);
      } catch (err) {
        console.error('初始化流程图时出错:', err);
        document.getElementById('flowchart-container').innerHTML = 
          '<div style="color: red; padding: 20px;">初始化流程图失败: ' + err.message + '</div>';
      }
    };
  </script>
</body>
</html>`;
};

// 导出为HTML文件
export const exportFlowchartToHtml = (
  nodes: FlowchartNode[],
  edges: FlowchartEdge[],
  title: string = '流程图',
  options?: { urlValidator?: RegExp }
): void => {
  // 转换数据
  const exportData = transformToExportFormat(nodes, edges, options);
  
  // 生成HTML内容
  const htmlContent = generateHtmlTemplate(exportData, title);
  
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
}; 
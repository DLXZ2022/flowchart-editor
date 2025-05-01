import React, { useCallback } from 'react';
import { ReactFlowInstance } from '@xyflow/react';

interface ExportImageButtonProps {
  rfInstance: ReactFlowInstance | null;
  nodePadding?: number;
  borderWidth?: number;
}

const ExportImageButton: React.FC<ExportImageButtonProps> = ({
  rfInstance,
  nodePadding = 10,
  borderWidth = 5,
}) => {
  // 导出为PNG
  const exportToPng = useCallback(() => {
    if (!rfInstance || !document) return;

    // 获取React Flow的DOM元素
    const flowElement = document.querySelector('.react-flow') as HTMLElement;
    if (!flowElement) return;

    // 获取所有节点的包围盒
    const nodesBounds = rfInstance.getNodes().reduce(
      (bounds, node) => {
        const nodeElement = document.querySelector(`[data-id="${node.id}"]`);
        if (!nodeElement) return bounds;

        const nodeRect = nodeElement.getBoundingClientRect();
        const nodeLeft = node.position.x;
        const nodeTop = node.position.y;
        const nodeWidth = nodeRect.width;
        const nodeHeight = nodeRect.height;

        return {
          minX: Math.min(bounds.minX, nodeLeft),
          minY: Math.min(bounds.minY, nodeTop),
          maxX: Math.max(bounds.maxX, nodeLeft + nodeWidth),
          maxY: Math.max(bounds.maxY, nodeTop + nodeHeight),
        };
      },
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
    );

    // 添加内边距
    const padding = nodePadding;
    const width = nodesBounds.maxX - nodesBounds.minX + padding * 2;
    const height = nodesBounds.maxY - nodesBounds.minY + padding * 2;

    // 创建Canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置背景色
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 设置变换，使所有节点都能够可见
    ctx.translate(-nodesBounds.minX + padding, -nodesBounds.minY + padding);

    // 临时隐藏控制面板和小地图
    const hideElements = ['.react-flow__panel', '.react-flow__minimap', '.react-flow__controls'];
    const hiddenElements = hideElements.map(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });
      return elements;
    });

    // 使用html2canvas渲染流程图
    try {
      // 创建一个临时的img元素
      const tmpImg = new Image();
      tmpImg.onload = () => {
        // 在Canvas上绘制图像
        ctx.drawImage(tmpImg, 0, 0);

        // 将Canvas转换为数据URL
        const dataUrl = canvas.toDataURL('image/png');

        // 创建下载链接
        const link = document.createElement('a');
        link.download = 'flowchart.png';
        link.href = dataUrl;
        link.click();

        // 恢复隐藏的元素
        hiddenElements.forEach(elements => {
          elements.forEach(el => {
            (el as HTMLElement).style.display = '';
          });
        });
      };

      // 使用原生API创建截图
      // 注意：这种方法在复杂情况下可能不完美，商业产品中应使用专业库
      const svgData = new XMLSerializer().serializeToString(
        flowElement.querySelector('svg') as SVGElement
      );
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      tmpImg.src = svgUrl;
    } catch (error) {
      console.error('导出PNG失败:', error);
      alert('导出PNG失败，请尝试使用其他浏览器或导出SVG格式');

      // 恢复隐藏的元素
      hiddenElements.forEach(elements => {
        elements.forEach(el => {
          (el as HTMLElement).style.display = '';
        });
      });
    }
  }, [rfInstance, nodePadding]);

  // 导出为SVG
  const exportToSvg = useCallback(() => {
    if (!rfInstance || !document) return;

    // 获取React Flow的SVG元素
    const flowElement = document.querySelector('.react-flow') as HTMLElement;
    if (!flowElement) return;

    const svgElement = flowElement.querySelector('svg') as SVGElement;
    if (!svgElement) return;

    // 克隆SVG元素以避免修改原始DOM
    const svgClone = svgElement.cloneNode(true) as SVGElement;

    // 设置白色背景
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', '100%');
    rect.setAttribute('height', '100%');
    rect.setAttribute('fill', 'white');
    svgClone.insertBefore(rect, svgClone.firstChild);

    // 移除控制面板和小地图
    const panelsToRemove = svgClone.querySelectorAll('.react-flow__panel, .react-flow__minimap, .react-flow__controls');
    panelsToRemove.forEach(panel => {
      if (panel.parentNode) {
        panel.parentNode.removeChild(panel);
      }
    });

    // 创建包含完整SVG的Blob
    const svgData = new XMLSerializer().serializeToString(svgClone);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    // 创建下载链接
    const link = document.createElement('a');
    link.href = svgUrl;
    link.download = 'flowchart.svg';
    link.click();

    // 清理URL对象
    URL.revokeObjectURL(svgUrl);
  }, [rfInstance]);

  if (!rfInstance) {
    return null;
  }

  return (
    <div className="flex space-x-2">
      <button
        onClick={exportToPng}
        className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
        title="导出为PNG图片"
      >
        导出PNG
      </button>
      <button
        onClick={exportToSvg}
        className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
        title="导出为SVG矢量图"
      >
        导出SVG
      </button>
    </div>
  );
};

export default ExportImageButton; 
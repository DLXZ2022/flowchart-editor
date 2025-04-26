import ELK from 'elkjs/lib/elk.bundled.js';
import { FlowchartNode, FlowchartEdge } from '../types';

const elk = new ELK();

// ELK布局选项
const elkOptions = {
  'elk.algorithm': 'layered',
  'elk.layered.spacing.nodeNodeBetweenLayers': '100',
  'elk.spacing.nodeNode': '80',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
};

/**
 * 将React Flow节点和边转换为ELK可用的格式
 * @param nodes React Flow节点数组
 * @param edges React Flow边数组
 * @returns ELK格式的图
 */
const toElkGraph = (nodes: FlowchartNode[], edges: FlowchartEdge[]) => {
  return {
    id: 'root',
    layoutOptions: elkOptions,
    children: nodes.map((node) => ({
      id: node.id,
      width: node.width || 250,  // 使用节点宽度或默认值
      height: node.height || 150, // 使用节点高度或默认值
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };
};

/**
 * 使用ELK布局算法重新排列节点位置
 * @param nodes 当前节点数组
 * @param edges 当前边数组
 * @returns 带有新位置的节点数组
 */
export const getLayoutedElements = async (
  nodes: FlowchartNode[],
  edges: FlowchartEdge[]
): Promise<FlowchartNode[]> => {
  if (!nodes.length) return nodes;
  
  // 转换为ELK可用格式
  const elkGraph = toElkGraph(nodes, edges);
  
  try {
    // 执行ELK布局算法
    const layoutedGraph = await elk.layout(elkGraph);
    
    // 用ELK计算的位置更新节点
    return nodes.map((node) => {
      const elkNode = layoutedGraph.children?.find((n) => n.id === node.id);
      
      if (elkNode && elkNode.x !== undefined && elkNode.y !== undefined) {
        // 更新节点位置，保持其他属性不变
        return {
          ...node,
          position: {
            x: elkNode.x,
            y: elkNode.y,
          },
        };
      }
      
      return node;
    });
  } catch (error) {
    console.error('ELK布局计算出错:', error);
    return nodes; // 出错时返回原始节点
  }
}; 
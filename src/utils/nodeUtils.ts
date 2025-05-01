import { Edge, Node } from '@xyflow/react';
import { v4 as uuidv4 } from 'uuid';
import type { NodeDataType, NodeTypeEnum, FlowchartNode } from '../types';

/**
 * 创建新节点
 * @param type 节点类型
 * @param position 节点位置
 * @param label 节点标签
 * @returns 新创建的节点对象
 */
export const createNewNode = (
  type: NodeTypeEnum,
  position: { x: number; y: number },
  label?: string
): FlowchartNode => {
  const id = uuidv4();
  return {
    id,
    type: 'custom',
    position,
    data: {
      label: label || `节点 ${id.slice(0, 4)}`,
      type,
      url: '',
      description: '',
      handleCounts: {
        top: 1,
        bottom: 1,
        left: 1,
        right: 1
      }
    },
  };
};

/**
 * 连接两个节点
 * @param sourceId 源节点ID
 * @param targetId 目标节点ID
 * @param sourceHandle 源连接点ID
 * @param targetHandle 目标连接点ID
 * @returns 新创建的边对象
 */
export const createEdge = (
  sourceId: string,
  targetId: string,
  sourceHandle?: string,
  targetHandle?: string
): Edge => {
  return {
    id: `e-${sourceId}-${targetId}-${Date.now()}`,
    source: sourceId,
    target: targetId,
    sourceHandle,
    targetHandle,
    type: 'smoothstep',
    animated: false,
    style: { strokeWidth: 2 },
  };
};

/**
 * 根据节点类型获取节点显示名称
 * @param type 节点类型
 * @returns 显示名称
 */
export const getNodeTypeName = (type: NodeTypeEnum): string => {
  switch (type) {
    case 'typeA':
      return '标题节点';
    case 'typeB':
      return '内容节点';
    case 'typeC':
      return '列表节点';
    default:
      return '未知节点';
  }
};

/**
 * 根据类型获取节点颜色类
 * @param type 节点类型
 * @returns tailwind颜色类名
 */
export const getNodeColorClass = (type: NodeTypeEnum): string => {
  switch (type) {
    case 'typeA':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'typeB':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'typeC':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

/**
 * 检查两个节点是否可以连接
 * 用于自定义连接验证规则
 * @param sourceNode 源节点
 * @param targetNode 目标节点
 * @returns 是否可以连接
 */
export const canNodesConnect = (sourceNode: Node, targetNode: Node): boolean => {
  // 简单示例：不允许相同类型的节点连接
  // 可以根据业务需要扩展更复杂的规则
  if (sourceNode.data.type === targetNode.data.type) {
    return false;
  }
  
  // 不允许循环连接
  if (sourceNode.id === targetNode.id) {
    return false;
  }
  
  return true;
};

/**
 * 为节点创建描述性标签
 * @param type 节点类型
 * @param index 索引
 * @returns 生成的节点标签
 */
export const generateNodeLabel = (type: NodeTypeEnum, index: number): string => {
  switch (type) {
    case 'typeA':
      return `标题 ${index}`;
    case 'typeB':
      return `内容 ${index}`;
    case 'typeC':
      return `列表 ${index}`;
    default:
      return `节点 ${index}`;
  }
};

/**
 * 查找特定类型的节点
 * @param nodes 节点数组
 * @param type 节点类型
 * @returns 过滤后的节点数组
 */
export const findNodesByType = (nodes: Node[], type: NodeTypeEnum): Node[] => {
  return nodes.filter(node => node.data.type === type);
};

/**
 * 计算节点的连接数量
 * @param edges 边数组
 * @param nodeId 节点ID
 * @returns 连接数量（作为源节点和目标节点）
 */
export const getNodeConnectionsCount = (edges: Edge[], nodeId: string): { asSource: number; asTarget: number } => {
  return {
    asSource: edges.filter(edge => edge.source === nodeId).length,
    asTarget: edges.filter(edge => edge.target === nodeId).length
  };
};

/**
 * 查找与节点相关的所有边
 * @param edges 边数组
 * @param nodeId 节点ID
 * @returns 与节点相关的边数组
 */
export const getNodeConnectedEdges = (edges: Edge[], nodeId: string): Edge[] => {
  return edges.filter(edge => edge.source === nodeId || edge.target === nodeId);
};

/**
 * 查找与节点直接相连的其他节点
 * @param nodes 节点数组
 * @param edges 边数组
 * @param nodeId 节点ID
 * @returns 直接相连的节点数组
 */
export const getConnectedNodes = (nodes: Node[], edges: Edge[], nodeId: string): Node[] => {
  const connectedNodeIds = new Set<string>();
  
  edges.forEach(edge => {
    if (edge.source === nodeId) {
      connectedNodeIds.add(edge.target);
    } else if (edge.target === nodeId) {
      connectedNodeIds.add(edge.source);
    }
  });
  
  return nodes.filter(node => connectedNodeIds.has(node.id));
}; 
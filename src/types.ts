import { Node, Edge, Viewport } from '@xyflow/react';

// 节点数据类型
export interface NodeDataType {
  label: string;
  url?: string;
  description?: string;
  comments?: string;
  type: 'typeA' | 'typeB' | 'typeC';
  flipped?: boolean;
  [key: string]: unknown;
}

// 边数据类型
export interface EdgeData {
  label?: string;
  [key: string]: unknown;
}

// 定义完整的节点和边类型，用于React Flow
export type NodeData = NodeDataType;
export type FlowchartNode = Node<NodeDataType>;
export type FlowchartEdge = Edge<EdgeData>;

// 完整的流程图数据
export interface FlowchartJson {
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
  viewport: Viewport;
} 
import { Node, Edge, Viewport } from '@xyflow/react';

// 节点类型枚举
export type NodeTypeEnum = 'typeA' | 'typeB' | 'typeC';

// 节点数据类型
export interface NodeDataType {
  label: string;
  url?: string;
  description?: string;
  comments?: string;
  type: NodeTypeEnum;
  flipped?: boolean;
  handleCounts?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  // 新增：可选的元数据字段，用于更细致的内容分类
  metadata?: {
    source?: string;
    importance?: 'high' | 'medium' | 'low';
    category?: string;
    keywords?: string[];
  };
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
  sidebarContent?: string; // 侧边栏markdown内容
} 
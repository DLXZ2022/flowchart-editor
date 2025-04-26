import { FlowchartJson, FlowchartNode, FlowchartEdge } from '../types';
import { Viewport, ReactFlowInstance } from '@xyflow/react';
import { z } from 'zod';

// Define a Zod schema for basic validation during import
const flowchartJsonSchema = z.object({
    nodes: z.array(z.object({
        id: z.string(),
        position: z.object({ x: z.number(), y: z.number() }),
        data: z.object({
            label: z.string(),
            url: z.string().url().optional(),
            comments: z.string().optional(),
            type: z.enum(['typeA', 'typeB', 'typeC']),
        }).passthrough(), // Allow other fields in data
        width: z.number().nullable(),
        height: z.number().nullable(),
        // Add other Node fields as needed, e.g., type, style, etc.
    }).passthrough()), // Allow other fields in node
    edges: z.array(z.object({
        id: z.string(),
        source: z.string(),
        target: z.string(),
        data: z.object({
           label: z.string().optional(),
        }).passthrough().optional(),
         // Add other Edge fields as needed, e.g., type, animated, style, etc.
    }).passthrough()), // Allow other fields in edge
    viewport: z.object({
        x: z.number(),
        y: z.number(),
        zoom: z.number(),
    }),
});


/**
 * Exports the current flowchart state to a JSON string.
 * @param rfInstance The ReactFlowInstance.
 * @returns A JSON string representing the flowchart, or null if instance is not available.
 */
export const exportFlowToJson = (
  rfInstance: ReactFlowInstance | null
): string | null => {
  if (!rfInstance) {
    console.error('ReactFlow实例不可用');
    return null;
  }

  const nodes = rfInstance.getNodes() as unknown as FlowchartNode[];
  const edges = rfInstance.getEdges() as unknown as FlowchartEdge[];
  const viewport = rfInstance.getViewport();

  if (nodes.length === 0) {
    return null;
  }

  const flowData: FlowchartJson = {
    nodes,
    edges,
    viewport,
  };

  return JSON.stringify(flowData, null, 2);
};

/**
 * Imports flowchart state from a JSON string.
 * @param jsonString The JSON string representing the flowchart.
 * @returns The parsed FlowchartJson object or null if parsing or validation fails.
 */
export const importFlowFromJson = (jsonString: string): FlowchartJson | null => {
  if (!jsonString.trim()) {
    return null;
  }

  try {
    // 解析JSON
    const flowData = JSON.parse(jsonString) as FlowchartJson;

    // 验证数据结构
    if (
      !flowData ||
      !Array.isArray(flowData.nodes) ||
      !Array.isArray(flowData.edges) ||
      !flowData.viewport
    ) {
      throw new Error('无效的流程图数据格式');
    }

    return flowData;
  } catch (error) {
    console.error('JSON解析错误:', error);
    throw error;
  }
}; 
import { FlowchartEdge } from '../types';

/**
 * 检查添加新边是否会导致循环
 * @param edges 当前所有边
 * @param newEdge 待添加的新边
 * @returns 如果会导致循环，则返回true；否则返回false
 */
export function checkForCyclicConnection(
  edges: FlowchartEdge[],
  newEdge: { source: string; target: string }
): boolean {
  // 创建图的邻接表
  const graph: Record<string, string[]> = {};
  
  // 先将现有的边加入到邻接表
  for (const edge of edges) {
    if (!graph[edge.source]) {
      graph[edge.source] = [];
    }
    graph[edge.source].push(edge.target);
  }
  
  // 添加新边
  if (!graph[newEdge.source]) {
    graph[newEdge.source] = [];
  }
  graph[newEdge.source].push(newEdge.target);
  
  // 使用深度优先搜索检测循环
  function dfs(node: string, visited: Set<string>, path: Set<string>): boolean {
    // 节点已经在当前路径中，检测到循环
    if (path.has(node)) return true;
    
    // 节点已经被访问过，且不在当前路径上，说明没有循环
    if (visited.has(node)) return false;
    
    // 标记节点已访问，并添加到当前路径
    visited.add(node);
    path.add(node);
    
    // 遍历所有相邻节点
    const neighbors = graph[node] || [];
    for (const neighbor of neighbors) {
      if (dfs(neighbor, visited, path)) {
        return true;
      }
    }
    
    // 回溯，将节点从当前路径移除
    path.delete(node);
    
    return false;
  }
  
  // 对图中所有节点进行DFS检测
  const visited = new Set<string>();
  const path = new Set<string>();
  
  // 只需要从新边的起点开始检测
  return dfs(newEdge.source, visited, path);
} 
import { FlowchartNode, FlowchartEdge, FlowchartJson } from '../types';

// 存储键名
const STORAGE_KEY = 'flowchart-editor-data';

// 保存流程图数据到本地存储
export const saveFlowchartToLocalStorage = (
  nodes: FlowchartNode[], 
  edges: FlowchartEdge[],
  viewport?: { x: number; y: number; zoom: number },
  sidebarContent?: string
): void => {
  try {
    const flowchartData: FlowchartJson = {
      nodes,
      edges,
      viewport: viewport || { x: 0, y: 0, zoom: 1 },
      sidebarContent
    };
    
    // 转换为JSON字符串并保存
    const jsonString = JSON.stringify(flowchartData);
    localStorage.setItem(STORAGE_KEY, jsonString);
    
    console.log('流程图数据已保存到本地存储');
  } catch (error) {
    console.error('保存流程图数据失败:', error);
  }
};

// 从本地存储加载流程图数据
export const loadFlowchartFromLocalStorage = (): FlowchartJson | null => {
  try {
    const jsonString = localStorage.getItem(STORAGE_KEY);
    if (!jsonString) {
      console.log('没有找到已保存的流程图数据');
      return null;
    }
    
    // 解析JSON字符串
    const flowchartData = JSON.parse(jsonString) as FlowchartJson;
    console.log('已从本地存储加载流程图数据');
    return flowchartData;
  } catch (error) {
    console.error('加载流程图数据失败:', error);
    return null;
  }
};

// 清除本地存储的流程图数据
export const clearFlowchartFromLocalStorage = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('已清除本地存储的流程图数据');
  } catch (error) {
    console.error('清除流程图数据失败:', error);
  }
};

// 检查本地存储中是否有保存的流程图数据
export const hasStoredFlowchart = (): boolean => {
  return !!localStorage.getItem(STORAGE_KEY);
}; 
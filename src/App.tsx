import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ReactFlowProvider,
  useReactFlow,
  NodeTypes,
  EdgeTypes,
  OnConnect,
  NodeMouseHandler,
  ReactFlowInstance,
  Viewport,
  SelectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// 自定义组件
import CustomNode from './components/CustomNode';
import CustomEdge from './components/CustomEdge';
import Toolbar from './components/Toolbar';
import Sidebar from './components/Sidebar';
import SidebarContent from './components/SidebarContent';
import ExportHtmlButton from './components/ExportHtmlButton';
import PropertiesSidebar from './components/PropertiesSidebar';
import ExportImageButton from './components/ExportImageButton';
import SearchBox from './components/SearchBox';

// 工具函数和类型
import { NodeDataType, EdgeData, FlowchartNode, FlowchartEdge } from './types';
import { checkForCyclicConnection } from './utils/graphValidation';
import { getLayoutedElements } from './utils/autoLayout';
import { 
  saveFlowchartToLocalStorage, 
  loadFlowchartFromLocalStorage, 
  clearFlowchartFromLocalStorage,
  hasStoredFlowchart 
} from './utils/storageUtils';

// 初始化深色模式
const initializeTheme = () => {
  // 首先检查用户之前的选择
  const savedTheme = localStorage.getItem('theme');
  
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else if (savedTheme === 'light') {
    document.documentElement.classList.remove('dark');
  } else {
    // 如果没有保存的主题，检查系统偏好
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }
};

// 在应用启动时初始化主题
initializeTheme();

// 生成唯一ID的辅助函数
const getId = (): string => `node_${Math.random().toString(36).substr(2, 9)}`;

// 定义不同节点类型
const nodeTypes: NodeTypes = {
  custom: CustomNode as any, // 使用类型断言解决类型问题
};

// 定义边类型
const edgeTypes: EdgeTypes = {
  custom: CustomEdge as any, // 使用类型断言解决类型问题
};

// 修改默认边属性，解决类型错误
const defaultEdgeOptions = {
  type: 'custom',
  animated: false,
  style: {
    strokeWidth: 2.5,
    stroke: '#94a3b8',
  },
  markerEnd: {
    type: 'arrowclosed' as const, // 使用类型断言确保类型安全
    width: 18,
    height: 18,
    color: '#94a3b8',
  },
  // 使用更大的圆角半径让线条更平滑
  pathOptions: {
    borderRadius: 30,
  },
};

// 初始节点和边
const initialNodes: FlowchartNode[] = [
  {
    id: '1',
    type: 'custom',
    position: { x: 250, y: 100 },
    data: { 
      label: '主页', 
      url: 'https://example.com', 
      type: 'typeA',
      description: '这是网站的主页，包含网站的基本介绍和导航',
      flipped: false,
      handleCounts: { top: 1, bottom: 1, left: 1, right: 1 }
    },
  },
  {
    id: '2',
    type: 'custom',
    position: { x: 250, y: 300 },
    data: { 
      label: '产品页', 
      url: 'https://example.com/products', 
      type: 'typeB',
      description: '展示公司的主要产品和服务内容',
      flipped: false,
      handleCounts: { top: 1, bottom: 1, left: 1, right: 1 }
    },
  },
];

const initialEdges: FlowchartEdge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'custom',
    data: { label: '点击浏览' },
  },
];

// 主应用组件
const FlowchartEditor: React.FC = () => {
  // 状态管理
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(true);
  const [lastSavedTime, setLastSavedTime] = useState<string>('未保存');
  
  // 添加历史记录用于撤销功能
  const [history, setHistory] = useState<{nodes: FlowchartNode[], edges: FlowchartEdge[]}[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1);
  const [isHistoryChanging, setIsHistoryChanging] = useState<boolean>(false);
  
  // 侧边栏状态
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [sidebarContent, setSidebarContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  
  // 节点选择状态
  const [selectedElements, setSelectedElements] = useState<{ nodes: string[], edges: string[] }>({
    nodes: [],
    edges: []
  });
  
  // 获取React Flow实例引用，用于导出功能
  const { getNodes, getEdges, getViewport, setViewport } = useReactFlow();
  const reactFlowRef = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  
  // 自动保存的定时器
  const autoSaveTimerRef = useRef<number | null>(null);
  
  // 添加选中节点的状态
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [propertiesOpen, setPropertiesOpen] = useState<boolean>(false);
  
  // 添加高亮节点的状态
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  
  // 获取选中的节点数据
  const selectedNode = useCallback(() => {
    if (!selectedNodeId) return null;
    const node = nodes.find(n => n.id === selectedNodeId);
    return node ? { id: node.id, data: node.data } : null;
  }, [selectedNodeId, nodes]);

  // 加载保存的数据
  useEffect(() => {
    if (hasStoredFlowchart()) {
      const savedData = loadFlowchartFromLocalStorage();
      if (savedData) {
        setNodes(savedData.nodes);
        setEdges(savedData.edges);
        // 设置视口位置
        if (savedData.viewport) {
          setTimeout(() => {
            setViewport({
              x: savedData.viewport.x,
              y: savedData.viewport.y,
              zoom: savedData.viewport.zoom,
            });
          }, 100);
        }
        // 加载侧边栏内容
        if (savedData.sidebarContent) {
          setSidebarContent(savedData.sidebarContent);
        }
      }
    }
  }, [setNodes, setEdges, setViewport]);
  
  // 手动保存当前流程图
  const saveFlowchart = useCallback(() => {
    const currentNodes = getNodes() as FlowchartNode[];
    const currentEdges = getEdges() as FlowchartEdge[];
    const viewport = getViewport();
    
    saveFlowchartToLocalStorage(currentNodes, currentEdges, viewport, sidebarContent);
    
    // 更新最后保存时间
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setLastSavedTime(timeString);
  }, [getNodes, getEdges, getViewport, sidebarContent]);
  
  // 侧边栏内容变化处理
  const handleSidebarContentChange = useCallback((content: string) => {
    setSidebarContent(content);
    // 标记有未保存的更改
    setLastSavedTime('有未保存的更改');
  }, []);
  
  // 清除保存的流程图
  const clearSavedFlowchart = useCallback(() => {
    if (window.confirm('确定要清除本地保存的流程图数据吗？这将无法恢复。')) {
      clearFlowchartFromLocalStorage();
      setLastSavedTime('未保存');
    }
  }, []);
  
  // 切换自动保存
  const toggleAutoSave = useCallback(() => {
    setAutoSaveEnabled(prev => !prev);
  }, []);
  
  // 设置自动保存
  useEffect(() => {
    if (autoSaveEnabled) {
      // 每30秒自动保存一次
      autoSaveTimerRef.current = window.setInterval(() => {
        saveFlowchart();
      }, 30000);
    } else if (autoSaveTimerRef.current) {
      window.clearInterval(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    
    return () => {
      if (autoSaveTimerRef.current) {
        window.clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [autoSaveEnabled, saveFlowchart]);
  
  // 当流程图有变化时设置保存提示
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      setLastSavedTime('有未保存的更改');
    }
  }, [nodes, edges]);
  
  // 记录当前状态到历史记录
  const saveToHistory = useCallback(() => {
    if (isHistoryChanging) return; // 如果正在恢复历史，不再保存新历史
    
    const currentNodes = getNodes() as FlowchartNode[];
    const currentEdges = getEdges() as FlowchartEdge[];
    
    // 创建新的历史记录
    setHistory(prev => {
      // 如果不是在最新状态，移除后面的历史
      const newHistory = prev.slice(0, currentHistoryIndex + 1);
      // 添加当前状态
      return [...newHistory, {nodes: JSON.parse(JSON.stringify(currentNodes)), edges: JSON.parse(JSON.stringify(currentEdges))}];
    });
    setCurrentHistoryIndex(prev => prev + 1);
  }, [getNodes, getEdges, currentHistoryIndex, isHistoryChanging]);

  // 撤销操作
  const handleUndo = useCallback(() => {
    // 检查是否有历史记录可撤销
    if (currentHistoryIndex > 0) {
      setIsHistoryChanging(true);
      const prevState = history[currentHistoryIndex - 1];
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setCurrentHistoryIndex(prev => prev - 1);
      setLastSavedTime('有未保存的更改');
      
      // 恢复完成后，重置标志
      setTimeout(() => {
        setIsHistoryChanging(false);
      }, 50);
    }
  }, [history, currentHistoryIndex, setNodes, setEdges]);

  // 初始加载时保存初始状态到历史记录
  useEffect(() => {
    // 只在组件首次挂载时保存初始状态
    if (history.length === 0 && nodes.length > 0) {
      saveToHistory();
    }
  }, [history.length, nodes.length, saveToHistory]);

  // 保存重要操作到历史记录
  // 替代之前直接观察nodes和edges的方式
  const saveHistoryAfterChange = useCallback(() => {
    if (!isHistoryChanging) {
      saveToHistory();
    }
  }, [saveToHistory, isHistoryChanging]);

  // 添加新节点时记录历史
  const onAddNode = useCallback(
    (type: NodeDataType['type']) => {
      const id = getId();
      const newNode: FlowchartNode = {
        id,
        type: 'custom',
        position: {
          x: Math.random() * 300 + 50,
          y: Math.random() * 300 + 50,
        },
        data: {
          label: `节点 ${id.slice(5, 8)}`,
          type: type,
          url: '',
          description: '请右键点击添加描述',
          flipped: false,
          handleCounts: { top: 1, bottom: 1, left: 1, right: 1 } // 默认每边1个连接点
        }
      };
      
      setNodes(nds => [...nds, newNode]);
      
      // 添加节点后保存历史
      setTimeout(saveHistoryAfterChange, 50);
    },
    [setNodes, saveHistoryAfterChange]
  );

  // 处理删除选中元素
  const deleteSelectedElements = useCallback(() => {
    if (selectedElements.nodes.length > 0 || selectedElements.edges.length > 0) {
      // 获取当前所有节点和边
      const currentNodes = getNodes() as FlowchartNode[];
      const currentEdges = getEdges() as FlowchartEdge[];
      
      // 获取选中的节点ID
      const selectedNodeIds = selectedElements.nodes;
      
      // 获取与选中节点关联的边ID
      const relatedEdgeIds = currentEdges
        .filter(edge => 
          selectedNodeIds.includes(edge.source) || 
          selectedNodeIds.includes(edge.target)
        )
        .map(edge => edge.id);
      
      // 获取选中的边ID
      const selectedEdgeIds = [...selectedElements.edges, ...relatedEdgeIds];
      
      // 删除选中的边和与选中节点关联的边
      if (selectedEdgeIds.length > 0) {
        setEdges(edges => edges.filter(edge => !selectedEdgeIds.includes(edge.id)));
      }

      // 删除节点
      if (selectedNodeIds.length > 0) {
        setNodes(nodes => nodes.filter(node => !selectedNodeIds.includes(node.id)));
      }

      // 重置选择状态
      setSelectedElements({ nodes: [], edges: [] });
      
      // 清除流程图状态为未保存
      setLastSavedTime('有未保存的更改');
      
      // 删除操作后保存历史
      setTimeout(saveHistoryAfterChange, 50);
    }
  }, [selectedElements, getNodes, getEdges, setNodes, setEdges, saveHistoryAfterChange]);

  // 在连接处理函数中也添加历史记录
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      // 验证连接是否会导致循环
      const isConnCreatesCycle = checkForCyclicConnection(
        edges as unknown as FlowchartEdge[],
        { source: connection.source || '', target: connection.target || '' }
      );
      
      if (isConnCreatesCycle) {
        alert('检测到循环连接，操作被阻止');
        return;
      }
      
      // 添加自定义边，默认使用CustomEdge类型
      const newEdge = {
        ...connection,
        type: 'custom',
        data: { label: '' }
      } as FlowchartEdge;
      
      setEdges((eds) => addEdge(newEdge, eds));
      
      // 连接操作后保存历史
      setTimeout(saveHistoryAfterChange, 50);
    },
    [edges, setEdges, saveHistoryAfterChange]
  );
  
  // 自动布局
  const onLayout = useCallback(async () => {
    const currentNodes = getNodes() as unknown as FlowchartNode[];
    const currentEdges = getEdges() as unknown as FlowchartEdge[];
    
    if (currentNodes.length === 0) {
      alert('无节点可布局');
      return;
    }
    
    // 显示加载中提示
    setNodes((nds) => 
      nds.map((node) => ({ ...node, draggable: false }))
    );
    
    try {
      // 使用ELK布局算法
      const layoutedNodes = await getLayoutedElements(
        currentNodes,
        currentEdges
      );
      
      // 更新节点位置
      setNodes(layoutedNodes);
    } catch (error) {
      console.error('自动布局出错:', error);
      // 恢复节点可拖动状态
      setNodes((nds) => 
        nds.map((node) => ({ ...node, draggable: true }))
      );
    }
  }, [getNodes, getEdges, setNodes]);
  
  // 处理节点点击
  const onNodeClick: NodeMouseHandler = useCallback((event, node) => {
    // 防止事件冒泡
    event.stopPropagation();
    
    // 如果点击的是当前选中的节点，则切换属性面板的显示状态
    if (node.id === selectedNodeId) {
      setPropertiesOpen(prev => !prev);
    } else {
      // 如果点击的是不同的节点，则选中该节点并打开属性面板
      setSelectedNodeId(node.id);
      setPropertiesOpen(true);
    }
  }, [selectedNodeId]);
  
  // 处理画布点击（取消选中节点）
  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setPropertiesOpen(false);
  }, []);
  
  // 更新节点数据的函数
  const updateNodeData = useCallback((nodeId: string, data: Partial<NodeDataType>) => {
    setNodes(nds => 
      nds.map(node => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...data
            }
          };
        }
        return node;
      })
    );
    
    // 标记有未保存的更改
    setLastSavedTime('有未保存的更改');
    
    // 保存到历史记录
    setTimeout(saveHistoryAfterChange, 50);
  }, [setNodes, setLastSavedTime, saveHistoryAfterChange]);
  
  // 关闭属性面板
  const closeProperties = useCallback(() => {
    setPropertiesOpen(false);
  }, []);
  
  // 节点右键菜单处理
  const onNodeContextMenu: NodeMouseHandler = useCallback(
    (event, node) => {
      // 防止默认的上下文菜单
      event.preventDefault();
      
      // 切换节点的编辑状态（翻转）
      const data = node.data as NodeDataType;
      
      setNodes(ns =>
        ns.map(n => {
          if (n.id === node.id) {
            return {
              ...n,
              data: {
                ...n.data,
                flipped: !data.flipped,
              },
            };
          }
          return n;
        })
      );
      
      // 如果打开了属性面板，关闭它
      if (propertiesOpen && selectedNodeId === node.id) {
        setPropertiesOpen(false);
      }
      
      // 更新lastSavedTime状态
      setLastSavedTime('有未保存的更改');
      
      // 保存到历史记录
      setTimeout(saveHistoryAfterChange, 50);
    },
    [setNodes, setLastSavedTime, saveHistoryAfterChange, propertiesOpen, selectedNodeId]
  );
  
  // 默认连接验证
  const isValidConnection = useCallback(
    (connection: Connection) => {
      // 不允许连接到自己
      if (connection.source === connection.target) {
        return false;
      }
      
      // 检查是否会导致循环
      return !checkForCyclicConnection(
        edges as unknown as FlowchartEdge[],
        { source: connection.source || '', target: connection.target || '' }
      );
    },
    [edges]
  );

  // 处理节点选择
  const onSelectionChange = useCallback(({ nodes: selectedNodes, edges: selectedEdges }: {
    nodes: Array<any>;
    edges: Array<any>;
  }) => {
    setSelectedElements({
      nodes: selectedNodes.map((node: any) => node.id),
      edges: selectedEdges.map((edge: any) => edge.id)
    });
  }, []);

  // 添加键盘事件处理器
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 如果当前在编辑状态（比如编辑侧边栏内容），不响应删除操作
      if (isEditing) return;
      
      if (event.key === 'Delete') { // 删除Backspace条件
        event.preventDefault();
        deleteSelectedElements();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [deleteSelectedElements, isEditing]);
  
  // 切换侧边栏开关
  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => {
      const newState = !prev;
      console.log('侧边栏状态:', newState); // 添加调试日志
      return newState;
    });
  }, []);

  // 切换编辑/预览模式
  const toggleEditMode = useCallback(() => {
    setIsEditing(prev => !prev);
  }, []);

  // 渲染ExportHtmlButton组件，传递sidebarContent
  const renderExportHtmlButton = useCallback(() => {
    return (
      <ExportHtmlButton 
        className="px-3 py-1" 
        sidebarContent={sidebarContent} 
      />
    );
  }, [sidebarContent]);

  // 渲染ExportImageButton组件
  const renderExportImageButton = useCallback(() => {
    return (
      <ExportImageButton
        rfInstance={reactFlowInstance}
      />
    );
  }, [reactFlowInstance]);

  // 处理节点聚焦
  const focusNode = useCallback((nodeId: string) => {
    if (!reactFlowInstance) return;
    
    // 找到节点
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    // 设置高亮状态
    setHighlightedNodeId(nodeId);
    
    // 聚焦到节点 - 将节点居中显示
    const x = node.position.x + 100; // 添加偏移量以便节点位于中心
    const y = node.position.y + 50;

    reactFlowInstance.setCenter(x, y, { duration: 800 });
    
    // 三秒后取消高亮
    setTimeout(() => setHighlightedNodeId(null), 3000);
  }, [reactFlowInstance, nodes]);
  
  // 根据高亮状态修改节点样式
  useEffect(() => {
    if (highlightedNodeId) {
      setNodes(nds => nds.map(n => {
        if (n.id === highlightedNodeId) {
          return {
            ...n,
            style: { 
              ...n.style,
              boxShadow: '0 0 8px 4px rgba(59, 130, 246, 0.6)' 
            },
            className: (n.className || '') + ' highlight-node'
          };
        }
        // 清除其他节点的高亮
        return {
          ...n,
          style: { 
            ...n.style,
            boxShadow: undefined 
          },
          className: (n.className || '').replace('highlight-node', '')
        };
      }));
    } else {
      // 清除所有节点的高亮状态
      setNodes(nds => nds.map(n => ({
        ...n,
        style: { 
          ...n.style,
          boxShadow: undefined 
        },
        className: (n.className || '').replace('highlight-node', '')
      })));
    }
  }, [highlightedNodeId, setNodes]);

  return (
    <div className="w-full h-screen">
      <Toolbar
        onAddNode={onAddNode}
        onLayout={onLayout}
        rfInstance={reactFlowInstance}
        setNodes={setNodes as any}
        setEdges={setEdges as any}
        onSave={saveFlowchart}
        onClearSaved={clearSavedFlowchart}
        autoSaveEnabled={autoSaveEnabled}
        onToggleAutoSave={toggleAutoSave}
        lastSavedTime={lastSavedTime}
        toggleSidebar={toggleSidebar}
        isSidebarOpen={sidebarOpen}
        onUndo={handleUndo}
        canUndo={currentHistoryIndex > 0}
        exportHtmlButton={renderExportHtmlButton()}
        exportImageButton={renderExportImageButton()}
      />
      <div className="h-[calc(100%-60px)] relative">
        <ReactFlow
          ref={reactFlowRef}
          nodes={nodes as any}
          edges={edges as any}
          onNodesChange={onNodesChange as any}
          onEdgesChange={onEdgesChange as any}
          onConnect={onConnect as any}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions as any}
          onInit={setReactFlowInstance as any}
          onSelectionChange={onSelectionChange}
          onPaneClick={onPaneClick}
          onNodeClick={onNodeClick as any}
          selectionOnDrag={false}
          selectionMode={SelectionMode.Partial}
          onNodeContextMenu={onNodeContextMenu as any}
          proOptions={{ hideAttribution: true }}
          selectNodesOnDrag={false}
          minZoom={0.1}
          maxZoom={8}
          nodesDraggable={!isEditing}
          nodesConnectable={!isEditing}
          className="dark:bg-gray-900"
        >
          <Controls className="dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700" />
          <MiniMap
            className="dark:bg-gray-800 dark:border-gray-700"
            nodeColor={(n) => {
              const data = n.data as NodeDataType;
              if (data.type === 'typeA') return '#3b82f6';
              if (data.type === 'typeB') return '#10b981';
              if (data.type === 'typeC') return '#f59e0b';
              return '#888';
            }}
          />
          <Background
            color="#aaa"
            gap={16}
            size={1}
            className="dark:bg-gray-900"
          />
          
          {/* 搜索框 */}
          <div className="absolute top-4 left-4 z-10">
            <SearchBox
              rfInstance={reactFlowInstance}
              onFocusNode={focusNode}
            />
          </div>
        </ReactFlow>
        
        {/* 侧边栏 */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={toggleSidebar}
          title="流程图注释"
        >
          <SidebarContent
            markdownContent={sidebarContent}
            onContentChange={handleSidebarContentChange}
            isEditing={isEditing}
            onToggleEdit={toggleEditMode}
          />
        </Sidebar>
        
        {/* 属性面板 */}
        <PropertiesSidebar
          isOpen={propertiesOpen}
          onClose={closeProperties}
          selectedNode={selectedNode()}
          onUpdateNodeData={updateNodeData}
        />
      </div>
    </div>
  );
};

// 包装主组件，提供React Flow上下文
const App: React.FC = () => (
  <ReactFlowProvider>
    <FlowchartEditor />
  </ReactFlowProvider>
);

export default App; 
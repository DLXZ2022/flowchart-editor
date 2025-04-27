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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// 自定义组件
import CustomNode from './components/CustomNode';
import CustomEdge from './components/CustomEdge';
import Toolbar from './components/Toolbar';
import Sidebar from './components/Sidebar';
import SidebarContent from './components/SidebarContent';
import ExportHtmlButton from './components/ExportHtmlButton';

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
  
  // 侧边栏状态
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [sidebarContent, setSidebarContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  
  // 获取React Flow实例引用，用于导出功能
  const { getNodes, getEdges, getViewport, setViewport } = useReactFlow();
  const reactFlowRef = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  
  // 自动保存的定时器
  const autoSaveTimerRef = useRef<number | null>(null);

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
  
  // 处理新连接
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
    },
    [edges, setEdges]
  );
  
  // 添加新节点
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
        },
      };
      
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes]
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
  
  // 节点点击处理，用于打开URL
  const onNodeClick: NodeMouseHandler = useCallback((event, node) => {
    const data = node.data as NodeDataType;
    
    // 只有当节点在正面（未翻转）状态下才打开URL
    if (!data.flipped && data.url) {
      window.open(data.url, '_blank');
    }
  }, []);
  
  // 处理节点右键点击（用于翻转节点）
  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: any) => {
    // 阻止默认右键菜单
    event.preventDefault();
    
    // 获取当前的翻转状态
    const currentFlipped = node.data.flipped;
    
    // 切换节点的翻转状态
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === node.id) {
          // 创建一个新的节点对象，确保更新被应用
          return {
            ...n,
            data: {
              ...n.data,
              flipped: !currentFlipped,
            },
          };
        }
        return n;
      })
    );
    
    // 打印日志以便调试
    console.log(`Node ${node.id} flipped: ${!currentFlipped}`);
  }, [setNodes]);
  
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
        exportHtmlButton={renderExportHtmlButton()}
      />
      <div className="h-[calc(100%-60px)] relative">
        <ReactFlow
          nodes={nodes as any}
          edges={edges as any}
          onNodesChange={onNodesChange as any}
          onEdgesChange={onEdgesChange as any}
          onConnect={onConnect as any}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={onNodeClick as any}
          onNodeContextMenu={onNodeContextMenu as any}
          isValidConnection={isValidConnection as any}
          onInit={setReactFlowInstance as any}
          fitView
          attributionPosition="bottom-left"
          ref={reactFlowRef}
        >
          <Controls />
          <MiniMap />
          <Background />
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
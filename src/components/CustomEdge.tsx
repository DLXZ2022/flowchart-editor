import React, { useState, useCallback } from 'react';
import { 
  EdgeProps, 
  getSmoothStepPath, 
  EdgeLabelRenderer,
  // useReactFlow, // 暂时移除，因为不更新全局状态
  Position
} from '@xyflow/react';
// import { EdgeData } from '../types'; // 再次注释掉 EdgeData

// 回退到使用 any 类型
const CustomEdge: React.FC<EdgeProps<any>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data, // data 是 any
  style = {},
  markerEnd,
  selected,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data?.label || '');
  // const { setEdges } = useReactFlow(); 

  // 使用平滑路径，提供更好的避让效果
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  });

  // 保存标签编辑
  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(e.target.value);
  };

  // 保持 handleLabelSave 只修改本地状态
  const handleLabelSave = useCallback(() => {
    setIsEditing(false);
  }, []);

  // 处理双击，如果 data.label 为空也进入编辑
  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  // 取消编辑逻辑
  const handleCancelEdit = useCallback(() => {
    setLabel(data?.label || ''); 
    setIsEditing(false);
  }, [data?.label]);

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          strokeWidth: selected ? 3 : 2,
          stroke: selected ? '#ff7300' : '#888',
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            background: 'white',
            padding: '4px 8px',
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 500,
            border: '1px solid #ddd',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            zIndex: 1 
          }}
          className="nodrag nopan"
          onDoubleClick={handleDoubleClick}
        >
          {isEditing ? (
            <div className="flex items-center">
              <input
                type="text"
                value={label}
                onChange={handleLabelChange}
                className="border px-1 py-0.5 text-xs w-auto min-w-[80px] mr-1 outline-none focus:ring-1 focus:ring-blue-400"
                autoFocus
                onBlur={handleLabelSave} 
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleLabelSave();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
              />
              <button 
                className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-0.5 rounded transition-colors"
                onClick={handleLabelSave}
                title="保存"
              >
                ✓
              </button>
            </div>
          ) : (
            <div
              className="cursor-pointer select-none min-h-[1em]"
              title="双击编辑标签"
            >
              {/* 使用 label 状态显示，为空时显示占位符 */}
              {label || <span className="text-gray-400 italic">(双击添加)</span>}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default CustomEdge; 
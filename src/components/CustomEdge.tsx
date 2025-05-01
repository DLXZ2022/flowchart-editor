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
  pathOptions,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data?.label || '');
  // const { setEdges } = useReactFlow(); 

  // 使用平滑路径，提供更好的避让效果和圆角
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: pathOptions?.borderRadius || 30, // 更大的圆角半径
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
          strokeWidth: selected ? 4 : 2.5, // 稍微细一点的线条
          stroke: selected ? '#6366f1' : '#94a3b8', // 选中时为靛蓝色，默认为浅灰色
          transition: 'stroke-width 0.2s, stroke 0.2s', // 平滑过渡动画
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
            fontSize: 11, // 更小的字体
            fontWeight: 500,
            zIndex: 1,
          }}
          className={`nodrag nopan px-2 py-0.5 rounded-full text-center shadow-sm transition-all duration-200
            ${selected 
              ? 'bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-700' 
              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'}`}
          onDoubleClick={handleDoubleClick}
        >
          {isEditing ? (
            <div className="flex items-center">
              <input
                type="text"
                value={label}
                onChange={handleLabelChange}
                className="border border-gray-300 dark:border-gray-600 px-1 py-0.5 text-xs w-auto min-w-[80px] mr-1 outline-none focus:ring-1 focus:ring-indigo-400 rounded dark:bg-gray-700 dark:text-gray-200"
                autoFocus
                onBlur={handleLabelSave} 
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleLabelSave();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
              />
              <button 
                className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs px-2 py-0.5 rounded transition-colors"
                onClick={handleLabelSave}
                title="保存"
              >
                ✓
              </button>
            </div>
          ) : (
            <div
              className={`cursor-pointer select-none min-h-[1em] min-w-[1.5em]
                ${selected 
                  ? 'text-indigo-800 dark:text-indigo-300' 
                  : 'text-gray-700 dark:text-gray-300'}`}
              title="双击编辑标签"
            >
              {/* 使用 label 状态显示，为空时显示占位符 */}
              {label || <span className="text-gray-400 dark:text-gray-500 italic text-[10px]">(双击添加)</span>}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default CustomEdge; 
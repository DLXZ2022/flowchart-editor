import React, { useState } from 'react';
import { 
  EdgeProps, 
  getSmoothStepPath, 
  getBezierPath,
  EdgeLabelRenderer
} from '@xyflow/react';
import { EdgeData } from '../types';

// 明确为自定义数据类型的边
const CustomEdge: React.FC<EdgeProps<EdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style = {},
  markerEnd,
  selected,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data?.label || '');

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

  const handleLabelSave = () => {
    // 实际项目中，这里应该调用setEdges来更新边数据
    // 但由于我们没有拿到setEdges，这里只是更新本地状态
    setIsEditing(false);
  };

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          strokeWidth: selected ? 3 : 2,
          stroke: selected ? '#ff7300' : '#888'
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      {(data?.label || isEditing) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              background: isEditing ? 'white' : 'rgba(255, 255, 255, 0.75)',
              padding: '4px 8px',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 500,
              border: '1px solid #ccc',
              boxShadow: isEditing ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
            }}
            className="nodrag nopan"
          >
            {isEditing ? (
              <div className="flex">
                <input
                  type="text"
                  value={label}
                  onChange={handleLabelChange}
                  className="border px-1 py-0.5 text-xs w-32 mr-1 outline-none"
                  autoFocus
                  onBlur={handleLabelSave}
                  onKeyDown={(e) => e.key === 'Enter' && handleLabelSave()}
                />
                <button 
                  className="bg-blue-500 text-white text-xs px-2 rounded" 
                  onClick={handleLabelSave}
                >
                  保存
                </button>
              </div>
            ) : (
              <div
                onDoubleClick={() => setIsEditing(true)}
                className="cursor-pointer select-none"
              >
                {data?.label || '(双击添加标签)'}
              </div>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default CustomEdge; 
import React from 'react';
import { 
  DocumentTextIcon, 
  DocumentIcon, 
  ListBulletIcon, 
  HashtagIcon
} from '@heroicons/react/24/outline';

interface NodeTypeIconProps {
  type: string;
  size?: number;
  className?: string;
}

const NodeTypeIcon: React.FC<NodeTypeIconProps> = ({ 
  type, 
  size = 20, 
  className = ""
}) => {
  let Icon;
  
  switch (type) {
    case 'typeA': // 标题
      Icon = HashtagIcon;
      break;
    case 'typeB': // 段落
      Icon = DocumentTextIcon;
      break;
    case 'typeC': // 列表
      Icon = ListBulletIcon;
      break;
    default:
      Icon = DocumentIcon;
  }
  
  return (
    <Icon 
      width={size} 
      height={size} 
      className={className}
    />
  );
};

export default NodeTypeIcon; 
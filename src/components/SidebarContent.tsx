import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface SidebarContentProps {
  markdownContent: string;
  onContentChange: (content: string) => void;
  isEditing: boolean;
  onToggleEdit: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({
  markdownContent,
  onContentChange,
  isEditing,
  onToggleEdit
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-md font-medium text-gray-700">流程图描述</h3>
        <button
          onClick={() => {
            onToggleEdit();
            // 保存当前内容
            if (isEditing) {
              onContentChange(markdownContent);
            }
          }}
          className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
        >
          {isEditing ? '保存' : '编辑'}
        </button>
      </div>

      {isEditing ? (
        <textarea
          value={markdownContent}
          onChange={(e) => onContentChange(e.target.value)}
          className="flex-1 p-2 border rounded resize-none font-mono text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="在这里添加Markdown格式的描述..."
        />
      ) : (
        <div className="flex-1 overflow-auto border rounded p-3 bg-gray-50 prose prose-sm max-w-none">
          <ReactMarkdown>
            {markdownContent}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default SidebarContent; 
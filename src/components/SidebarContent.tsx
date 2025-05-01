import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  const [isPreviewing, setIsPreviewing] = useState(false);

  // 切换预览模式（仅在编辑模式下有效）
  const togglePreview = () => {
    if (isEditing) {
      setIsPreviewing(!isPreviewing);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-md font-medium text-gray-700 dark:text-gray-200">流程图注释</h3>
        <div className="flex space-x-2">
          {isEditing && (
            <button
              onClick={togglePreview}
              className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {isPreviewing ? '编辑' : '预览'}
            </button>
          )}
          <button
            onClick={() => {
              // 如果是从编辑模式切到查看模式，关闭预览
              if (isEditing) {
                setIsPreviewing(false);
              }
              // 切换编辑模式
              onToggleEdit();
            }}
            className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-800 dark:text-blue-200 dark:hover:bg-blue-700 transition-colors"
          >
            {isEditing ? '保存' : '编辑'}
          </button>
        </div>
      </div>

      {isEditing ? (
        isPreviewing ? (
          // 预览模式 - 显示渲染后的Markdown
          <div className="flex-1 overflow-auto border rounded p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 prose prose-sm md:prose-base dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {markdownContent}
            </ReactMarkdown>
          </div>
        ) : (
          // 编辑模式 - 显示文本编辑框
          <div className="flex flex-col flex-1">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              支持Markdown格式，包括标题、列表、链接、表格等
            </div>
            <textarea
              value={markdownContent}
              onChange={(e) => onContentChange(e.target.value)}
              className="flex-1 p-3 border rounded resize-none font-mono text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              placeholder="在这里添加Markdown格式的描述..."
              style={{ minHeight: "500px" }}
            />
          </div>
        )
      ) : (
        // 查看模式 - 显示渲染后的Markdown
        <div className="flex-1 overflow-auto border rounded p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 prose prose-sm md:prose-base dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {markdownContent || '没有注释内容，点击"编辑"按钮添加内容。'}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default SidebarContent; 
# Web连接编辑器

一个基于React和ReactFlow构建的、功能丰富、交互友好的Web流程图编辑器。

## 项目简介

一个简易的结合Web的流程图，可用作展示或笔记，项目初衷是快速整理学习路线，以便后期复习

## 核心功能

- 🖱️ **直观的画布操作**: 
    - 通过工具栏添加不同类型的节点。
    - 拖拽节点自由布局。
    - 从节点连接点拖出即可创建连接线。
    - 支持画布平移和缩放。
- ✏️ **灵活的编辑功能**: 
    - **节点编辑**: 右键点击节点可翻转卡片，编辑其标签、目标URL（编辑完成后节点可点击跳转）和详细描述。
    - **连接线编辑**: 双击连接线可添加或修改标签。
- ✨ **自定义节点/边**: 
    - 支持多种预设节点类型（蓝、绿、黄），易于区分。
    - 自定义渲染的节点和边提供了独特的交互体验。
- 📐 **智能布局与连接**: 
    - 一键**自动布局**功能 (基于ELKjs)，优化复杂图形的排列。
    - 自动阻止创建循环连接，保证流程逻辑的有效性。
- 💾 **数据持久化**: 
    - **自动保存**: 编辑内容每30秒自动保存到浏览器`localStorage`。
    - **手动保存**: 可随时点击保存按钮。
    - **自动加载**: 打开应用时自动加载上次保存的状态。
    - **清除数据**: 提供清除本地存储的选项。
- 📤 **多种导出选项**: 
    - **导出JSON**: 将整个流程图数据（节点、边、视口）导出为JSON文件，方便备份、迁移或二次开发。
    - **导出HTML**: 生成一个独立的、可交互的HTML文件，无需依赖原应用即可查看流程图（包含节点点击跳转功能）。
- 📥 **导入功能**: 支持从符合格式的JSON文件导入流程图数据。

## 技术栈

- **核心库**: React 18, TypeScript, ReactFlow (@xyflow/react v12)
- **布局引擎**: ELKjs
- **构建工具**: Vite
- **样式**: TailwindCSS
- **数据验证**: Zod
- **状态管理**: React Hooks (useState, useCallback, useEffect, useRef), ReactFlow Hooks

## 环境要求

- Node.js: 16.x 或更高版本
- npm: 8.x 或更高版本
- 现代Web浏览器 (Chrome, Firefox, Edge等)

## 快速开始

### 先决条件

确保你的开发环境中已安装 Node.js 和 npm。

### 安装

1.  克隆仓库:
    ```bash
    git clone https://github.com/your-username/flowchart-editor.git
    cd flowchart-editor
    ```

2.  安装依赖:
    ```bash
    npm install
    ```

### 运行

#### 方法一：手动启动

启动Vite开发服务器：
```bash
npm run dev
```
然后在浏览器中访问：`http://localhost:3000` (端口号基于`start.bat`，如果Vite配置不同请相应修改)。

#### 方法二：使用启动脚本（Windows）

直接双击运行项目根目录中的 `start.bat` 文件。
该脚本将自动检查环境、安装依赖（如果需要）并启动应用，最后尝试在浏览器中打开 `http://localhost:3000`。

## 开发

- **代码检查 (Lint)**: `npm run lint`
- **生产构建**: `npm run build`

## 项目结构

```
flowchart-editor/
├── src/
│   ├── components/       # React 组件
│   │   ├── CustomNode.tsx  # 自定义节点实现 (含编辑逻辑)
│   │   ├── CustomEdge.tsx  # 自定义边实现 (含标签编辑)
│   │   └── Toolbar.tsx     # 顶部工具栏UI与交互
│   ├── utils/            # 辅助函数与逻辑模块
│   │   ├── autoLayout.ts   # ELKjs 自动布局
│   │   ├── exportToHtml.ts # 导出HTML逻辑
│   │   ├── graphValidation.ts# 图验证 (如循环检测)
│   │   ├── jsonUtils.ts    # JSON导入/导出
│   │   └── storageUtils.ts # 本地存储操作
│   ├── types.ts          # TypeScript 类型定义
│   ├── App.tsx           # 主应用组件 (ReactFlow配置、状态、回调)
│   └── main.tsx          # 应用入口点
├── start.bat             # Windows 启动脚本
├── package.json          # 项目配置与依赖
├── README.md             # 项目说明文档
└── ...                   # 其他配置文件 (Vite, TS, Tailwind, etc.)
```

## 贡献指南

欢迎提交问题 (Issues) 和拉取请求 (Pull Requests)。对于重大更改，请先创建一个Issue进行讨论。

## 许可证

MIT 
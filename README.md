# 流程图编辑器

一个简单而强大的流程图编辑工具，基于React和ReactFlow构建。

![流程图编辑器截图](screenshot.png)

## 功能特点

- 创建和编辑节点
- 自定义节点标签、URL和描述
- 连接节点创建流程图
- 编辑连接线标签
- 直观友好的用户界面
- 支持拖拽操作

## 环境要求

- Node.js 16.x 或更高版本
- npm 8.x 或更高版本

## 安装

1. 克隆仓库
```bash
git clone https://github.com/your-username/flowchart-editor.git
cd flowchart-editor
```

2. 安装依赖
```bash
npm install
```

## 使用方法

### 方法一：手动启动

启动开发服务器：
```bash
npm run dev
```

然后在浏览器中访问：`http://localhost:3000`

### 方法二：使用启动脚本（Windows）

双击运行项目根目录中的 `start.bat` 文件，脚本将自动检查环境、安装依赖并启动应用。

## 操作说明

### 添加节点
- 单击工具栏中的"添加节点"按钮
- 点击画布上的位置放置新节点

### 编辑节点
- 双击节点打开编辑面板
- 可以编辑节点的标签、URL和描述
- 点击保存按钮应用更改

### 连接节点
- 从一个节点拖动连接线到另一个节点
- 仅允许单向连接（不能创建循环）

### 编辑连接线
- 点击连接线可以编辑标签
- 双击连接线编辑更多属性

## 项目结构

```
flowchart-editor/
├── src/
│   ├── components/       # 组件文件夹
│   │   ├── CustomNode.tsx  # 自定义节点组件
│   │   ├── CustomEdge.tsx  # 自定义边组件
│   │   └── Toolbar.tsx     # 工具栏组件
│   ├── types.ts          # 类型定义
│   ├── App.tsx           # 主应用组件
│   └── main.tsx          # 入口文件
├── public/               # 静态资源
├── start.bat             # Windows启动脚本
└── package.json          # 项目配置
```

## 技术栈

- React 18
- TypeScript
- ReactFlow (基于@xyflow/react)
- Vite
- TailwindCSS
- Zod (用于验证)

## 许可证

MIT 
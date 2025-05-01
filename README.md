# Web连接编辑器

一个基于React和ReactFlow构建的、功能丰富、交互友好的Web流程图编辑器，现在集成了Web内容爬取和初步的流程图自动生成功能。

## 项目简介

一个结合Web爬取和ReactFlow的流程图工具，可用作展示或笔记。项目初衷是快速整理学习路线，后扩展为从URL自动生成初步流程图，以便后期复习和编辑。

## 核心功能

- 🖱️ **直观的画布操作**: 
    - 通过工具栏添加不同类型的节点。
    - 拖拽节点自由布局。
    - 从节点连接点拖出即可创建连接线。
    - 支持画布平移和缩放。
    - 悬停节点可显示详细信息 Tooltip (使用 `NodeToolbar` 实现，定位更精确)。
- ✏️ **灵活的编辑功能**: 
    - **节点编辑**: 通过右侧的 **属性面板** 编辑节点的标签、目标URL（编辑完成后节点可点击跳转）、详细描述、节点类型以及各方向的连接点数量 (0-4)。
    - **快速标签编辑**: **双击** 节点标签可以直接进行编辑。
    - **连接线编辑**: 双击连接线可添加或修改标签。
- ✨ **自定义节点/边**: 
    - 支持多种预设节点类型（蓝、绿、黄），易于区分。
    - 自定义渲染的节点（标题突出，内容摘要显示）和边提供了独特的交互体验。
- 🌐 **Web内容生成**:
    - **结构生成 (默认)**: 在工具栏输入 URL，点击 **"结构生成"** 按钮。后端将：
        1.  爬取网页内容。
        2.  使用 Readability.js 清理并提取主体内容和基本结构 (HTML)。
        3.  调用 `/api/extract-advanced` 接口，该接口分析提取出的结构信息，生成更具逻辑层次的流程图节点和边。
    - **文本提取**: 在工具栏输入 URL，点击 **"文本提取"** 按钮。后端将：
        1.  爬取网页内容 (同上，使用 Readability)。
        2.  调用 `/api/extract` 接口，该接口主要使用 Readability 提取出的纯文本内容，进行简单的段落分割来生成流程图节点和顺序连接。 (此功能主要用于对比或未来集成 AI 进行内容处理)。
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
- **Web爬虫与内容提取**: Crawlee (PlaywrightCrawler), @mozilla/readability, jsdom
- **后端**: Node.js, Express
- **包管理器**: Yarn (v1.x) (项目已统一使用 Yarn)

## 环境要求

- **通用**: Git, [Node.js](https://nodejs.org/) (v16+), `yarn` (v1.x) (请确保已通过 `npm install --global yarn` 安装)
- **Linux/Ubuntu**: 可能需要安装 Playwright 所需的系统依赖（运行安装脚本时通常会有提示）。
- **Windows**: 确保 WMI 服务正常且 `wmic.exe` 可访问 (通常需要 `C:\Windows\System32\wbem` 在 PATH 中)。Playwright 可能也需要特定的系统依赖。

## 小白入门教程 (Step-by-Step Guide for Beginners)

本教程将指导您如何从零开始，在您的计算机上设置并运行此流程图编辑器项目。假设您是初学者，我们将尽量解释每个步骤。

**第一步：准备您的计算机 (安装必备软件)**

在开始之前，您需要确保计算机上安装了以下免费软件：

1.  **Git**: 这是一个版本控制工具，用于从 GitHub (代码托管网站) 下载项目代码。
    *   访问 [https://git-scm.com/downloads](https://git-scm.com/downloads)
    *   下载适合您操作系统 (Windows, macOS, Linux) 的安装程序并运行。
    *   安装过程中，通常保持默认选项即可。

2.  **Node.js (包含 npm)**: 这是运行项目代码的基础环境 (Node.js) 和一个包管理器 (npm)，用于安装 Yarn。
    *   访问 [https://nodejs.org/](https://nodejs.org/)
    *   推荐下载 **LTS (长期支持)** 版本，它更稳定。
    *   下载适合您操作系统的安装程序并运行。
    *   安装过程中，确保勾选了将 Node.js 和 npm 添加到系统路径 (PATH) 的选项 (通常默认勾选)。
    *   安装完成后，您可以打开命令行工具 (见下一步) 输入 `node -v` 和 `npm -v`，如果能看到版本号输出，则表示安装成功。

3.  **Yarn**: 这是本项目 **统一使用的包管理器**。
    *   安装完 Node.js 和 npm 后，在命令行中运行：
        ```bash
        npm install --global yarn
        ```
    *   安装完成后，输入 `yarn --version`，如果能看到版本号输出，则表示安装成功。

4.  **代码编辑器 (推荐)**: 虽然不是必须的，但一个好的代码编辑器能让您更方便地查看和修改代码。推荐使用免费且功能强大的 **Visual Studio Code (VS Code)**。
    *   访问 [https://code.visualstudio.com/](https://code.visualstudio.com/)
    *   下载并安装。

5.  **(仅 Windows 用户) 检查 WMI**: 这个项目的部分功能依赖 Windows 的一个系统工具 `wmic.exe`。
    *   通常它应该存在于 `C:\Windows\System32\wbem` 并且系统可以找到它。如果后面的步骤中遇到与 `wmic.exe` 相关的错误，请尝试以 **管理员身份** 打开 **命令提示符 (cmd)** 或 **PowerShell**，然后运行 `sfc /scannow` 命令来扫描和修复系统文件，完成后重启电脑。
    在powershell中运行dism /online /add-capability /capability:wmic~~~~ ,即可下载（参考https://xbin.live/archives/4174）

**第二步：获取项目代码**

现在我们需要从 GitHub 下载项目代码。

1.  **打开命令行工具**: 
    *   **Windows**: 在开始菜单搜索 `cmd` (命令提示符) 或 `PowerShell` 并打开。
    *   **Linux/Ubuntu**: 通常使用 `Terminal` (终端) 应用。
2.  **选择一个存放项目的目录**: 在命令行中，使用 `cd` (change directory) 命令进入您想要存放项目代码的文件夹。例如，如果您想放在 D 盘的 `projects` 目录下：
    ```bash
    D:
    cd projects
    ```
3.  **克隆 (下载) 代码**: 在命令行中粘贴并运行以下命令 (将 `your-username/flowchart-editor.git` 替换为实际的仓库地址，如果不同的话)：
    ```bash
    git clone https://github.com/your-username/flowchart-editor.git
    ```
    这会在当前目录下创建一个名为 `flowchart-editor` 的新文件夹，并将所有项目代码下载到里面。
4.  **进入项目目录**: 下载完成后，使用 `cd` 命令进入项目文件夹：
    ```bash
    cd flowchart-editor
    ```

**第三步：安装项目依赖**

项目代码依赖许多第三方库才能运行。我们需要使用 Yarn 来安装它们。

1.  **运行统一安装命令**: 确保您当前在项目根目录 (`flowchart-editor`) 下。在命令行中运行以下 **推荐的命令**：
    ```bash
    yarn setup
    ```
    或者，您也可以使用另一个脚本：
    ```bash
    yarn download 
    ```
    这两个命令都会执行类似的操作：
    *   安装前端依赖 (使用 Yarn)
    *   安装后端依赖 (使用 Yarn)
    *   安装 Playwright 浏览器
    请耐心等待所有步骤完成，这可能需要几分钟时间，取决于您的网络速度。

**第四步：启动应用程序**

这个项目包含两个主要部分：前端和后端。我们需要同时启动它们。

1.  **启动后端服务**:
    *   确保您仍在项目根目录 (`flowchart-editor`) 下。
    *   在命令行中运行（使用我们定义的脚本）：
        ```bash
        yarn dev:backend 
        ```
    *   您会看到后端服务启动的日志信息。**保持这个命令行窗口打开**，服务需要持续运行。

2.  **启动前端服务**:
    *   **打开一个新的命令行窗口** (不要关闭后端的窗口)。
    *   确保您在这个新窗口中也处于项目根目录 (`flowchart-editor`) 下。
    *   运行：
        ```bash
        yarn dev:frontend
        ```
    *   您会看到前端开发服务器 (Vite) 启动的日志信息，通常会显示一个本地访问地址。**保持这个命令行窗口也打开**。

*或者，您可以使用一个命令同时启动前后端（如果安装了 `concurrently`）：*
```bash
yarn start:dev
```
*这只需要一个命令行窗口。*

**第五步：访问应用程序**

当两个服务都成功启动后：

1.  查看 **前端** 命令行窗口的输出 (或者如果您使用了 `start:dev`，查看那个窗口的输出)。
2.  您应该会看到类似 `Local: http://localhost:5173/` 这样的地址。这是您可以在浏览器中访问的本地网址。
3.  打开您的 Web 浏览器 (如 Chrome, Firefox, Edge)。
4.  在地址栏输入上面看到的地址 (通常是 `http://localhost:5173`) 并回车。
5.  如果一切顺利，您应该能看到流程图编辑器的界面了！

**遇到问题怎么办？(Troubleshooting)**

*   **依赖安装失败 (`yarn setup` 或 `yarn download`)**: 仔细查看命令行输出的详细错误信息。检查您的网络连接是否正常。确认 Node.js 和 yarn 都已正确安装并添加到系统路径。可能缺少某些系统依赖 (特别是 Playwright 浏览器安装步骤)。
*   **脚本执行权限问题 (Linux/macOS)**: 如果 `yarn download` 内部调用 `download.sh` 时出现权限错误，请尝试手动给 `download.sh` 添加执行权限：`chmod +x download.sh`，然后再次运行下载命令。
*   **脚本执行权限问题 (PowerShell)**: 如果 `yarn download` 内部调用 `download.ps1` 时遇到执行策略错误，它会尝试使用 `-ExecutionPolicy Bypass` 绕过。如果仍然失败，您可能需要以管理员身份打开 PowerShell 并调整执行策略 (请谨慎操作并了解其含义)。
*   **Playwright 浏览器安装失败**: 确保网络连接良好，系统有足够权限下载和安装。查看 Playwright 的官方文档获取特定操作系统的故障排除步骤。
*   **`wmic.exe` 错误 (Windows)**: 尝试以管理员身份运行 `sfc /scannow` 并重启，或运行 `dism` 命令安装。
*   **端口冲突**: 后端默认使用 5000 端口，前端默认使用 5173 端口。如果这些端口已被其他程序占用，启动会失败。您需要关闭占用端口的程序或修改项目配置 (较复杂)。
*   **爬取功能失败**: 确保 Playwright 浏览器已成功安装 (通过 `yarn setup` 或 `yarn download`)。检查 **后端** 命令行窗口是否有报错信息。确认输入的 URL 是可访问的。

**下一步**

现在您可以开始使用编辑器了！尝试在顶部的输入框中输入一个网址 (例如 `https://www.example.com`)，然后点击 **"结构生成"** 按钮，看看自动生成的流程图效果。您也可以点击 **"文本提取"** 按钮体验不同的生成方式。同时，您可以手动添加、编辑节点和连接线。

## 快速开始 (供有经验的开发者)

### 1. 获取代码

```bash
git clone https://github.com/your-username/flowchart-editor.git
cd flowchart-editor
```

### 2. 安装依赖

```bash
# 在项目根目录运行统一安装命令 (推荐)
yarn setup
# 或者 yarn download
```

### 3. 运行应用

```bash
# 使用一个终端同时启动前后端 (推荐)
yarn start:dev

# 或者，分别在两个终端中启动：
# 终端 1 (启动后端):
# yarn dev:backend
# 终端 2 (启动前端):
# yarn dev:frontend
```

### 4. 访问应用

启动后，在浏览器中访问 Vite 提供的地址 (通常是 `http://localhost:5173`)。

## 开发

- **代码检查 (Lint)**: `yarn lint` (在根目录运行)
- **生产构建 (前端)**: `yarn build` (在根目录运行)

## 项目结构 (简化)

```
flowchart-editor/
├── flowchart-backend/       # 后端 Node.js/Express 应用
│   ├── src/                 # 后端源码
│   │   ├── crawler/         # 爬虫与提取逻辑
│   │   │   └── extractionUtils.js # 内容提取工具 (Readability等)
│   │   ├── server.js        # Express 服务器与 API 路由
│   │   └── index.ts         # (可能存在的 TS 入口或旧文件)
│   ├── storage/             # Crawlee 存储目录
│   ├── package.json         # 后端 Yarn 依赖
│   └── yarn.lock            # 后端 Yarn 锁文件
│   └── tsconfig.json        # 后端 TS 配置
├── src/                     # 前端 React 应用源码
│   ├── components/          # React 组件
│   │   ├── CustomNode.tsx   # 自定义节点实现 (显示, 交互)
│   │   ├── CustomEdge.tsx   # 自定义边实现 (标签编辑)
│   │   ├── Toolbar.tsx      # 顶部工具栏 UI 与交互
│   │   ├── PropertiesSidebar.tsx # 节点属性编辑侧边栏
│   │   └── ...              # 其他组件 (Sidebar, Tooltip, etc.)
│   ├── types/               # TypeScript 类型定义
│   ├── utils/               # 工具函数 (节点、布局、存储等)
│   └── App.tsx              # 主应用组件 (ReactFlow 核心逻辑)
│   └── main.tsx             # 应用入口
├── public/                  # 静态资源
├── package.json             # 前端 Yarn 依赖
├── yarn.lock                # 前端 Yarn 锁文件
├── download-deps.js         # 跨平台依赖下载启动器
├── download.ps1             # Windows 依赖下载脚本
├── download.sh              # Linux/macOS 依赖下载脚本
├── vite.config.ts           # Vite 配置
├── tsconfig.json            # 前端 TS 配置
├── tailwind.config.js       # Tailwind CSS 配置
├── README.md                # 项目说明 (就是你正在看的这个文件)
└── ...                      # 其他配置文件 (.gitignore, .eslintrc.cjs等)
```

## 贡献

欢迎提出 Issues 或 Pull Requests！

## License

[MIT](LICENSE) 
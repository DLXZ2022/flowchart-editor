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
- **Web爬虫**: Crawlee (PlaywrightCrawler)
- **后端**: Node.js, Express

## 环境要求

- **通用**: Git, [Node.js](https://nodejs.org/) (v16+), npm (v8+)
- **Linux/Ubuntu**: 可能需要安装 `build-essential` 或类似包，用于编译某些 npm 依赖。
- **Windows**: 确保 WMI 服务正常且 `wmic.exe` 可访问 (通常需要 `C:\Windows\System32\wbem` 在 PATH 中)。

## 小白入门教程 (Step-by-Step Guide for Beginners)

本教程将指导您如何从零开始，在您的计算机上设置并运行此流程图编辑器项目。假设您是初学者，我们将尽量解释每个步骤。

**第一步：准备您的计算机 (安装必备软件)**

在开始之前，您需要确保计算机上安装了以下免费软件：

1.  **Git**: 这是一个版本控制工具，用于从 GitHub (代码托管网站) 下载项目代码。
    *   访问 [https://git-scm.com/downloads](https://git-scm.com/downloads)
    *   下载适合您操作系统 (Windows, macOS, Linux) 的安装程序并运行。
    *   安装过程中，通常保持默认选项即可。

2.  **Node.js (包含 npm)**: 这是运行项目代码的基础环境 (Node.js) 和一个包管理器 (npm)，用于下载项目所需的各种库文件。
    *   访问 [https://nodejs.org/](https://nodejs.org/)
    *   推荐下载 **LTS (长期支持)** 版本，它更稳定。
    *   下载适合您操作系统的安装程序并运行。
    *   安装过程中，确保勾选了将 Node.js 和 npm 添加到系统路径 (PATH) 的选项 (通常默认勾选)。
    *   安装完成后，您可以打开命令行工具 (见下一步) 输入 `node -v` 和 `npm -v`，如果能看到版本号输出，则表示安装成功。

3.  **代码编辑器 (推荐)**: 虽然不是必须的，但一个好的代码编辑器能让您更方便地查看和修改代码。推荐使用免费且功能强大的 **Visual Studio Code (VS Code)**。
    *   访问 [https://code.visualstudio.com/](https://code.visualstudio.com/)
    *   下载并安装。

4.  **(仅 Windows 用户) 检查 WMI**: 这个项目的部分功能依赖 Windows 的一个系统工具 `wmic.exe`。
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

项目代码依赖许多第三方库才能运行（比如 React, ReactFlow, Crawlee 等）。我们需要使用 npm 将这些库下载到项目中。

我们提供了方便的脚本来完成此操作。

*   **Windows 用户**: 
    1.  确保您当前在 PowerShell 窗口中 (如果在 cmd 中，可以输入 `powershell` 进入)。
    2.  运行安装脚本：
        ```powershell
        .\download.ps1
        ```
    3.  **权限提示**: 如果您看到关于"执行策略"的错误，说明 PowerShell 阻止运行脚本。您可以输入以下命令 **临时** 允许本次运行 (执行完后策略会自动恢复)：
        ```powershell
        Set-ExecutionPolicy Bypass -Scope Process -Force
        ```
        然后再重新运行 `.\download.ps1`。
    4.  脚本会自动下载所有需要的库文件和 Playwright 浏览器。这可能需要几分钟时间，取决于您的网络速度。

*   **Linux/Ubuntu 用户**: 
    1.  首先需要给脚本添加执行权限：
        ```bash
        chmod +x download.sh
        ```
    2.  运行安装脚本：
        ```bash
        ./download.sh
        ```
    3.  脚本会自动下载所有需要的库文件和 Playwright 浏览器。

**第四步：启动应用程序**

这个项目包含两个主要部分：

*   **后端 (Backend)**: 负责处理数据，比如爬取网页内容、生成流程图数据。它是一个 API 服务。
*   **前端 (Frontend)**: 用户在浏览器中看到的界面，负责展示流程图、与用户交互，并与后端通信。

我们需要同时启动这两个部分。

*   **Windows 用户**: 
    1.  在 PowerShell 窗口中运行启动脚本：
        ```powershell
        .\start.ps1
        ```
    2.  **权限提示**: 同样，如果遇到执行策略错误，请先运行 `Set-ExecutionPolicy Bypass -Scope Process -Force` 再试。
    3.  您会看到 **两个新的命令行窗口** 弹出，一个标题为 "Flowchart Backend"，另一个是 "Flowchart Frontend"。这些窗口会显示服务的启动日志。**不要关闭这两个新窗口**，它们需要保持运行。
    4.  原始的 PowerShell 窗口会显示一些信息并提示您可以按 Enter 退出。您可以按 Enter 关闭这个原始窗口，服务已经在新窗口中运行了。

*   **Linux/Ubuntu 用户**: 
    1.  给启动脚本添加执行权限：
        ```bash
        chmod +x start.sh
        ```
    2.  运行启动脚本：
        ```bash
        ./start.sh
        ```
    3.  启动信息会直接显示在当前的终端窗口中，同时启动后端和前端。要停止服务时，可以按 `Ctrl + C`。

**第五步：访问应用程序**

当启动脚本成功运行后：

1.  观察 **前端** (Frontend) 的启动日志 (Windows 用户看标题为 "Flowchart Frontend" 的窗口，Linux 用户看当前终端)。
2.  您应该会看到类似 `Local: http://localhost:5173/` 这样的地址。这是您可以在浏览器中访问的本地网址。
3.  打开您的 Web 浏览器 (如 Chrome, Firefox, Edge)。
4.  在地址栏输入上面看到的地址 (通常是 `http://localhost:5173`) 并回车。
5.  如果一切顺利，您应该能看到流程图编辑器的界面了！

**遇到问题怎么办？(Troubleshooting)**

*   **脚本执行权限问题 (PowerShell)**: 尝试运行 `Set-ExecutionPolicy Bypass -Scope Process -Force`。
*   **脚本执行权限问题 (Linux/Ubuntu)**: 确保使用了 `chmod +x` 命令。
*   **`wmic.exe` 错误 (Windows)**: 尝试以管理员身份运行 `sfc /scannow` 并重启。
*   **依赖安装失败 (`download.ps1` / `download.sh` / `npm run setup`)**: 检查您的网络连接是否正常。可以尝试进入对应的目录 (`cd flowchart-backend` 或项目根目录) 手动运行 `npm install` 查看详细错误。
*   **端口冲突**: 脚本默认使用端口 5000 (后端) 和 5173 (前端)。如果这些端口已被其他程序占用，启动会失败。您需要关闭占用端口的程序或修改项目配置 (较复杂)。
*   **爬取功能失败**: 确保 Playwright 浏览器已通过 `download` 脚本或 `npm run install:browsers` 成功安装。检查后端窗口是否有报错信息。

**下一步**

现在您可以开始使用编辑器了！尝试在顶部的输入框中输入一个网址 (例如 `https://www.example.com`)，然后点击"生成"按钮，看看自动生成的流程图效果。您也可以手动添加、编辑节点和连接线。更多功能请参考本 README 的其他部分。

## 快速开始

### 1. 获取代码

```bash
git clone https://github.com/your-username/flowchart-editor.git
cd flowchart-editor
```

### 2. 安装依赖与设置 (推荐)

此步骤会安装前后端所有 npm 依赖，并下载 Playwright 浏览器驱动。

*   **跨平台方法 (使用 npm script):**
    ```bash
    npm run setup
    ```
*   **Windows (PowerShell):**
    ```powershell
    .\download.ps1 
    ```
    *(如果遇到执行策略问题，可能需要先运行 `Set-ExecutionPolicy Bypass -Scope Process -Force`)*
*   **Linux/Ubuntu (Bash):**
    ```bash
    chmod +x download.sh
    ./download.sh
    ```

### 3. 运行应用

此步骤会同时启动后端 API 服务和前端 Vite 开发服务器。

*   **跨平台方法 (使用 npm script):**
    ```bash
    npm run start:dev
    ```
    *(按 Ctrl+C 停止)*
*   **Windows (PowerShell):**
    ```powershell
    .\start.ps1
    ```
    *(服务将在新窗口中启动，可关闭此脚本窗口)*
*   **Linux/Ubuntu (Bash):**
    ```bash
    chmod +x start.sh
    ./start.sh
    ```
    *(按 Ctrl+C 停止)*

### 4. 访问应用

启动后，在浏览器中访问前端开发服务器提供的地址 (通常是 `http://localhost:5173`)。

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
├── flowchart-backend/    # 后端服务
│   ├── src/
│   │   └── server.js     # Express 服务器 (爬虫和内容提取API)
│   └── package.json      # 后端依赖
├── start.ps1             # PowerShell 启动脚本 (Windows)
├── start.bat             # Windows Batch 启动脚本 (备用)
├── start.sh              # Bash 启动脚本 (Linux/Ubuntu)
├── download.ps1          # PowerShell 依赖安装脚本 (Windows)
├── download.bat          # Windows 依赖安装脚本 (备用)
├── download.sh           # Bash 依赖安装脚本 (Linux/Ubuntu)
├── package.json          # 项目配置与依赖 (前端/根)
├── README.md             # 项目说明文档
└── ...                   # 其他配置文件 (Vite, TS, Tailwind, etc.)
```

## 贡献指南

欢迎提交问题 (Issues) 和拉取请求 (Pull Requests)。对于重大更改，请先创建一个Issue进行讨论。

## 许可证

MIT 
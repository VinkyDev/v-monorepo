### v-monorepo 项目模板

现代化全栈开发模板，集成桌面端、Web端和Node服务，采用monorepo架构管理。

## 项目概述

基于 pnpm workspaces 的全栈开发 monorepo 模板，整合了桌面端（Electron）、Web端（React）和后端（Hono）应用。

### 技术栈

**前端**
- React 19 + React Compiler
- TailwindCSS + Shadcn UI

**桌面端**
- Electron 39

**服务端**
- Hono

**构建工具**
- Vite 7 (Web)
- electron vite + electron-builder (Desktop)
- tsup (Server)
- rslib (Packages)

## 常用命令

### 开发
```bash
pnpm dev:react          # 启动 React Web 应用
pnpm dev:electron       # 启动 Electron 应用
pnpm dev:desktop        # 同时启动 React 和 Electron
pnpm dev:server         # 启动 Hono 后端服务
```

### 构建
```bash
pnpm build:packages     # 构建所有共享包（应用构建前必须执行）
pnpm build:react        # 构建 React 应用
pnpm build:electron     # 构建 Electron 应用
pnpm build:server       # 构建服务端
pnpm build:mac          # 打包 Electron macOS 版本
pnpm build:win          # 打包 Electron Windows 版本
pnpm build:linux        # 打包 Electron Linux 版本
```

### 代码质量
```bash
pnpm lint               # 检查所有包
pnpm typecheck          # 类型检查所有包
pnpm check              # 并行运行 lint、typecheck 和 knip
pnpm knip               # 检查未使用的依赖/导出
```

### 初始化
```bash
pnpm run setup          # 清理、安装依赖并构建包
pnpm run clean          # 清理 dist 和 node_modules
```

## 架构

### 工作区结构
- **apps/** - 主应用
  - `electron/` - 桌面应用，使用 electron-vite
  - `react/` - Web 前端，使用 Vite + React 19 + Tailwind CSS v4
  - `server/` - 后端 API，使用 Hono + tsx

- **packages/** - 共享库（使用 rslib 构建）
  - `bridge/` - 应用间通信层
  - `ui/` - 共享 React 组件（Radix UI + shadcn/ui 模式）
  - `utils/` - 通用工具函数
  - `types/` - 共享 TypeScript 类型定义
  - `logger/` - 日志工具
  - `react-helper/` - React 辅助工具
  - `config/` - 共享配置

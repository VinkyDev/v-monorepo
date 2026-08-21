# v-monorepo

基于 [Vite+](https://viteplus.dev/guide/) 的全栈 TypeScript 模板。一套工具链覆盖 Web、API、Agent 和 Electron 桌面壳，前后端共享类型、错误码与校验。

工作区包名跟随目录：`@v-monorepo/<directory-name>`

## 技术栈

### 工具链

| 层       | 选型                                        | 说明                                                  |
| -------- | ------------------------------------------- | ----------------------------------------------------- |
| 统一 CLI | [Vite+](https://viteplus.dev/guide/) (`vp`) | 开发、构建、测试、格式化、Lint 走同一套命令           |
| 打包     | Vite + Rolldown                             | `vp dev` / `vp build`，Web 与 Server 都在 Vite 体系内 |
| 包管理   | pnpm workspace + catalog                    | 版本集中在 `pnpm-workspace.yaml`                      |
| 语言     | TypeScript 7                                | 严格模式；共享 tsconfig 在 `@v-monorepo/config`       |
| 运行时   | Node.js ≥ 22.18                             | Server / Agents 生产入口是 Node                       |
| 质量     | Oxlint、Oxfmt、Vitest                       | `vp check` 格式化 + Lint + 类型检查；`vp test` 跑测试 |

### 前端 `apps/web`

| 层   | 选型                                                                                |
| ---- | ----------------------------------------------------------------------------------- |
| UI   | React 19                                                                            |
| 路由 | [TanStack Router](https://tanstack.com/router)（文件路由，`routeTree.gen.ts` 生成） |
| 数据 | [TanStack Query](https://tanstack.com/query)                                        |
| 样式 | Tailwind CSS 4                                                                      |
| 组件 | [shadcn](https://ui.shadcn.com/)（base-sera）+ [Base UI](https://base-ui.com/)      |
| 图标 | lucide-react                                                                        |

### 后端 `apps/server`

| 层         | 选型                                                               |
| ---------- | ------------------------------------------------------------------ |
| 框架       | [Hono](https://hono.dev/)                                          |
| 类型化调用 | [Hono RPC](https://hono.dev/docs/guides/rpc)，`AppType` 驱动客户端 |
| 校验       | Zod + `@hono/standard-validator`                                   |
| 文档       | hono-openapi + Swagger UI（`/docs`、`/openapi.json`）              |
| 运行       | 开发用 `@hono/vite-dev-server`；生产 SSR 打成 `dist/server.mjs`    |

### Agent `apps/agents`

| 层   | 选型                              |
| ---- | --------------------------------- |
| 框架 | [Flue](https://flueframework.com) |

与 Web/Server 的错误契约相互独立；在 Agent 调用本仓库 API 之前不必强行对齐。

### 桌面 `apps/desktop`

| 层     | 选型                                                                  |
| ------ | --------------------------------------------------------------------- |
| 运行时 | Electron（main / preload 与渲染进程隔离，sandbox + contextIsolation） |
| 渲染   | 直接加载 `@v-monorepo/web`，不复制前端                                |
| 构建   | `vp` 打 main / preload；小脚本编排开发服与热重启                      |
| 打包   | electron-builder；窗口始终 `app://bundle/`，`/api` 由主进程转发       |

### 契约与数据

| 层          | 选型                                                                    | 说明                                                              |
| ----------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Schema      | Zod 4                                                                   | 请求体、环境变量、共享 payload                                    |
| 环境变量    | [T3 Env](https://env.t3.gg) (`@t3-oss/env-core`)                        | 进程启动时校验，缺了或类型不对直接失败                            |
| 错误        | `AppError` + `errorCatalog`                                             | 服务端 throw、客户端还原，同一套码                                |
| HTTP 错误体 | [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html) Problem Details | `application/problem+json`，由 `toResponse` / `fromResponse` 处理 |
| 请求追踪    | `x-request-id`                                                          | 客户端注入，服务端回写                                            |

业务错误加在 `packages/shared` 的 `businessErrors`；`throw new AppError("YOUR_CODE")` 即可，可选 `{ message }` 覆盖默认文案。

## 仓库结构

```
apps/
  web/          React 应用（浏览器与 Electron 共用）
  server/       Hono API
  agents/       Flue Agent
  desktop/      Electron 壳：main + preload
packages/
  shared/            契约：Zod、错误码、AppError、Electron IPC 类型
  logger/            tslog 封装：测试静音、请求关联
  api-client/        Hono RPC 客户端
  ui/                shadcn 组件（生成物，避免手改）
  utils/             es-toolkit 再导出 + cn + isDesktop / shellApi
  config/            TypeScript presets
```

数据流：页面 → `@v-monorepo/api-client`（Hono RPC）→ `apps/server`；类型来自 `AppType`，错误与 payload 来自 `@v-monorepo/shared`。

## 快速开始

需要 Node.js ≥ 22.18 与 pnpm 11。

```sh
vp install
```

每个 app 的默认环境变量已能跑通。要覆盖时把对应 `.env.example` 复制为 `.env`。

```sh
pnpm dev:all          # 同时启动 web / server / agents（不含 Electron）
pnpm dev:web          # http://localhost:5173
pnpm dev:server       # http://127.0.0.1:3001，文档 /docs
pnpm dev:agents       # http://localhost:5174
pnpm dev:desktop      # Electron 壳 + web 开发服
pnpm package:desktop  # 打当前平台安装包；/api 默认转到 127.0.0.1:3001
```

```sh
vp check              # 格式化、Lint、类型检查
vp test
vp run ready          # check + 全仓测试 + 构建
vp update -r --latest # 更新所有依赖到最新版本
```

## 常用约定

- 命令用 `vp`。`vp <name>` 是内置命令，`vp run <name>` 才跑 `package.json` / `vite.config.ts` 里的脚本。
- 新的 API 路由挂到 `AppType`（`@v-monorepo/server/api`），客户端自动拿到类型。
- 新的共享 payload：在 `@v-monorepo/shared` 加 Zod schema，服务端路由和 Web 调用共用。
- 桌面能力：按域加文件（今天是 shell）：shared 通道、main `ipc/` handler、preload 模块；在 `ipcInit` 里组合。页面从 `@v-monorepo/utils` 调对应域 API（`shellApi()`）。测试打 utils 的 desktop lookup、IPC 域策略、renderer 路由。页面始终 `/api`；换真实后端设 `API_ORIGIN`。
- UI 组件用 shadcn CLI 加到 `packages/ui`，不要为了 Lint 去改生成文件。

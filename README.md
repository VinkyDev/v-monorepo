# v-monorepo

基于 [Vite+](https://viteplus.dev/guide/) 的全栈 TypeScript 模板。一套工具链覆盖 Web、API、Agent；桌面端是可选的 Electron 壳。

工作区包名跟随目录：`@v-monorepo/<directory-name>`

## 技术栈

### 工具链

| 层 | 选型 | 说明 |
| --- | --- | --- |
| 统一 CLI | [Vite+](https://viteplus.dev/guide/) (`vp`) | 开发、构建、测试、格式化、Lint 走同一套命令 |
| 打包 | Vite + Rolldown | `vp dev` / `vp build` |
| 包管理 | pnpm 12.4.1 workspace + catalog | `engines.pnpm` 固定；缺失时由 `devEngines.packageManager` 下载；catalog 在 `pnpm-workspace.yaml` |
| 语言 | TypeScript 7 | 严格模式；共享 tsconfig 在 `@v-monorepo/config` |
| 运行时 | Node.js 24.19.0 (LTS) | `.node-version` 固定；`vp env` 按此解析 |
| 质量 | [Ultracite](https://www.ultracite.ai/) → Oxlint、Oxfmt；Vitest | 预设经根目录 `vite.config.ts` 接入 Vite+；`vp check` 格式化 + Lint + 类型检查；`vp test` 跑测试 |
| 工具函数 | [es-toolkit](https://es-toolkit.dev) | 通用工具直接 `import { … } from "es-toolkit"`；项目特有 helper 才进 `@v-monorepo/utils` |
| CI | GitHub Actions + setup-vp | `vp check` → 全仓测试 → 构建；Vite Task 结果跨 run 缓存 |

### 前端 `apps/web`

| 层 | 选型 |
| --- | --- |
| UI | React 19 |
| 路由 | [TanStack Router](https://tanstack.com/router)（文件路由，`routeTree.gen.ts` 生成） |
| 数据 | [TanStack Query](https://tanstack.com/query) |
| 样式 | Tailwind CSS 4 |
| 组件 | [shadcn](https://ui.shadcn.com/)（base-sera）+ [Base UI](https://base-ui.com/) |
| 图标 | lucide-react |

### 后端 `apps/server`

| 层 | 选型 |
| --- | --- |
| 框架 | [Hono](https://hono.dev/) |
| 类型化调用 | [Hono RPC](https://hono.dev/docs/guides/rpc)，`AppType` 驱动客户端 |
| 校验 | Zod + hono-openapi `validator`（校验同时写进 OpenAPI 文档） |
| 文档 | hono-openapi + Swagger UI（`/docs`、`/openapi.json`） |
| 运行 | 开发用 `@hono/vite-dev-server`；生产打成自包含 `dist/server.mjs`（依赖全内联，无需 node_modules） |

### Agent `apps/agents`

| 层            | 选型                                               |
| ------------- | -------------------------------------------------- |
| 框架          | [Mastra](https://mastra.ai)                        |
| 开发          | `mastra dev`（Studio + REST）                      |
| 存储          | PostgreSQL（`DATABASE_URL`，本地 5432）            |
| Observability | `@mastra/observability`（Studio traces）           |
| Editor        | `@mastra/editor`（Studio 改 instructions / tools） |

Mastra 自带 Studio、REST 与错误契约。覆盖它会打断 Studio 和 `mastra api`，所以这一层保持 Mastra 自己的契约，不并入下面的 `ApiError`。

### 桌面 `apps/desktop`

| 层 | 选型 |
| --- | --- |
| 运行时 | Electron（main / preload 与渲染进程隔离，sandbox + contextIsolation） |
| 渲染 | 直接加载 `@v-monorepo/web`，不复制前端 |
| 构建 | `vp` 打 main / preload；小脚本编排开发服与热重启 |
| 打包 | electron-builder；窗口始终 `app://bundle/`，`/api` 由主进程转发 |

### 契约与数据

| 层 | 选型 | 说明 |
| --- | --- | --- |
| Schema | Zod 4 | 请求体、环境变量、共享 payload |
| 环境变量 | [T3 Env](https://env.t3.gg) (`@t3-oss/env-core`) | 进程启动时校验，缺了或类型不对直接失败 |
| 错误 | `ApiError` + `errorCatalog` | 服务端 throw、客户端还原，同一套码；HTTP 与 Electron IPC 共用 |
| 日志与上报 | `@v-monorepo/logger` 的 `LogSink` | 所有日志与上报只有这一个出口 |

## 错误与日志

错误体是 `application/json`，配正确的 HTTP status 与 `X-Request-Id` 响应头：

```json
{
  "code": "invalid_params",
  "message": "参数校验失败",
  "data": {
    "fields": [{ "path": "email", "message": "Invalid email address" }]
  }
}
```

`code` 是唯一的分支依据，HTTP status 只表达协议语义（同一个 status 可以对应多个业务码）。`data` 的形状由 `code` 决定：`isApiError(error, "email_taken")` 会把 `error.data` 收窄到 `{ email: string }`。

**新增一个业务错误**（后两步可选）：

1. 在 `packages/shared/src/error-catalog.ts` 的 `businessErrors` 加一条 `{ status, message }`。
2. 需要结构化载荷时，在同文件的 `errorDataSchemas` 加一条 Zod schema —— 类型与运行时校验都从它派生。
3. 需要全局副作用（比如跳转登录）时，在 `apps/web/src/lib/api-error-effects.ts` 的 `apiErrorEffects` 加一条；命中后调用方不再提示。

服务端 `throw new ApiError("email_taken", { data: { email } })`，客户端在 `apiFetch` 里原样还原成同一个 `ApiError`。演示见 `/demo` 页面与 `apps/server/src/routes/demo`。

**接入监控**：模板不含任何上报 SDK。所有日志与已分类的错误都流经 `packages/logger` 的 `LogSink`。sink 列表初始为空，由各进程入口自行组装（入口已各有一行 `addSink(consoleSink)`），接入监控就是在旁边再加一个 sink，业务代码零改动：

```ts
import { addSink, serializeError } from "@v-monorepo/logger";

addSink({
  name: "sentry",
  write: ({ level, event, message, meta, error }) => {
    if (level === "debug" || level === "info") {
      return;
    }
    Sentry.captureException(error ?? new Error(message), {
      contexts: { error: error === undefined ? {} : serializeError(error) },
      extra: meta,
      level: level === "warn" ? "warning" : level,
      tags: { event },
    });
  },
});
```

`@sentry/hono`、`Sentry.reactErrorHandler`、`@sentry/electron` 的自动插桩与这个 sink 互补：前者负责性能与未捕获异常，后者负责我们主动分类过的错误。

## 仓库结构

```
apps/
  web/          React 应用
  server/       Hono API
  agents/       Mastra Agent
  desktop/      Electron 壳（可选）
packages/
  shared/            契约：Zod、错误码表、ApiError
  logger/            同构日志：LogRecord / LogSink，上报的唯一出口
  api-client/        Hono RPC 传输工厂（`hc<AppType>`，不列请求函数）
  ui/                UI 组件（shadcn + Base UI）
  electron/          桌面桥：IPC 目录与渲染进程访问器（可选）
  utils/             项目内 helper（优先 es-toolkit）
  config/            TypeScript presets
```

数据流：页面 `useQuery` → `apiClient`（`@v-monorepo/api-client` 传输工厂）→ `apps/server`。路由与响应类型来自 `AppType`；错误来自 `ApiError`。

## 代码规范

代码风格由 [Ultracite](https://www.ultracite.ai/) 的 Oxlint / Oxfmt 预设约束。根目录 `vite.config.ts` 接入 Vite+：

| 项 | 本仓库 |
| --- | --- |
| 格式化 | `ultracite/oxfmt` |
| Lint | `ultracite/oxlint`：`core`、`react`、`tanstack`、`vitest`、`anti-slop` |
| 类型 | `lint.options.typeAware` 与 `typeCheck`（含 `typescript/no-deprecated` 等类型感知规则） |
| 提交 | `staged` 对改动执行 `vp check --fix` |

## 快速开始

```sh
vp install
```

每个 app 的默认环境变量已能跑通。要覆盖时把对应 `.env.example` 复制为 `.env`。

```sh
pnpm dev:web          # http://localhost:5173
pnpm dev:server       # http://127.0.0.1:3001，文档 /docs
pnpm dev:agents       # http://localhost:4111
pnpm dev:desktop      # Electron 壳 + web 开发服
pnpm package:desktop  # 打当前平台安装包；/api 默认转到 127.0.0.1:3001
```

```sh
vp check              # 格式化、Lint、类型检查
vp test
vp run ready          # check + 全仓测试 + 构建
vp update -r --latest # 更新所有依赖到最新版本
```

## Project Overview

A monorepo template for full-stack development integrating desktop (Electron), web (React), and backend (Hono) applications using pnpm workspaces.

## Common Commands

### Development
```bash
pnpm dev:react          # Start React web app
pnpm dev:electron       # Start Electron app
pnpm dev:desktop        # Start both React and Electron together
pnpm dev:server         # Start Hono backend server
```

### Building
```bash
pnpm build:packages     # Build all shared packages (required before apps)
pnpm build:react        # Build React app
pnpm build:electron     # Build Electron app
pnpm build:server       # Build server
pnpm build:mac          # Package Electron for macOS
pnpm build:win          # Package Electron for Windows
pnpm build:linux        # Package Electron for Linux
```

### Code Quality
```bash
pnpm lint               # Lint all packages
pnpm typecheck          # Type check all packages
pnpm check              # Run lint, typecheck, and knip concurrently
pnpm knip               # Check for unused dependencies/exports
```

### Setup
```bash
pnpm run setup              # Clean, install, and build packages
pnpm run clean              # Clean dist and node_modules
```

## Architecture

### Workspace Structure
- **apps/** - Main applications
  - `electron/` - Desktop app using electron-vite
  - `react/` - Web frontend using Vite + React 19 + Tailwind CSS v4
  - `server/` - Backend API using Hono + tsx

- **packages/** - Shared libraries (build with rslib)
  - `bridge/` - Communication layer between apps
  - `ui/` - Shared React components (Radix UI + shadcn/ui pattern)
  - `utils/` - Common utility functions
  - `types/` - Shared TypeScript type definitions
  - `logger/` - Logging utilities
  - `react-helper/` - React-specific helpers
  - `config/` - Shared configuration

### Key Dependencies
- **Package Manager**: pnpm 10.12.4 (enforced via `only-allow`)
- **Version Catalog**: Dependencies centralized in `pnpm-workspace.yaml`
- Uses `catalog:` and `workspace:*` references for consistent versions

### Build Order
Shared packages must be built before apps. Run `pnpm build:packages` first, or use `pnpm run setup` for fresh installations.

## Code Standards

### Comments
- Use Chinese comments (中文注释) to explain key logic and complex algorithms
- Only add comments where necessary - code should be self-documenting when possible
- Focus comments on "why" rather than "what"

### Libraries and Dependencies
- **Don't reinvent the wheel** - prefer established libraries:
  - React hooks: Use `ahooks` for common hook patterns
  - Utilities: Use `lodash-es` for general utilities
- If third-party libraries cannot meet requirements, check `packages/utils` first before implementing
- Add new utilities to `packages/utils` for project-wide reuse

### Code Organization
- **High cohesion, low coupling**: Split components and logic reasonably
- **Single Responsibility Principle**: Each module/function should have one clear purpose
- Keep components focused and composable
- Extract shared logic into hooks or utilities

### TypeScript
- **Never use `any`** - use generics to improve code reusability and type safety
- When `any` is unavoidable, use `unknown` instead and narrow the type
- Leverage TypeScript's type system fully for better IDE support and fewer runtime errors
- Define clear interfaces and types for data structures

### Modern JavaScript/TypeScript Patterns
- Use optional chaining `?.` to safely access nested properties
- Use nullish coalescing `??` instead of `||` when appropriate
- Prefer `async/await` over raw Promises for asynchronous operations
- Use template literals for string interpolation

### Error Handling
- Flatten error handling - avoid excessive nested `try-catch` blocks
- Use centralized, converged error handling patterns
- Let errors bubble up to appropriate boundaries (API middleware, error boundaries)
- For expected errors, use explicit error types/codes rather than throwing

### Design Principles
- Follow **DRY (Don't Repeat Yourself)** - extract repeated logic
- Avoid over-engineering - balance abstraction with practicality
- Prioritize **readability** and **maintainability** over cleverness
- Keep code simple and obvious when possible

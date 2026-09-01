<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+ release. Add a tool name to select part of the graph. For example, run `vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use `vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

# Writing Elegant Code for Development

- Move directly to the final design. Assume breaking changes are acceptable and remove every obsolete state rather than carrying it forward.
- Use these instructions only when deployed consumers, persisted production data, public contracts, and staged rollouts do not require compatibility.
- Fix root causes at the correct abstraction instead of adding local patches.
- Start with the smallest end-to-end implementation that works. Add only capabilities required now, and complete each layer before adding the next.
- Keep components modular, responsibilities focused, and concerns clearly separated.
- Finish changes across every abstraction they touch while leaving unrelated areas intact.
- Make architectural decisions for the long term. Do not introduce stopgaps intended to be replaced later.

## Design

- Use the fewest concepts, paths, configuration options, and extension points that fully satisfy current requirements.
- Avoid speculative abstractions, indirection, and flexibility without a concrete use case.
- Do not preserve backward compatibility.
- Remove obsolete APIs, schemas, implementations, configuration, call sites, tests, and documentation in the same change.
- Replace old paths outright. Do not add adapters, compatibility branches, deprecated aliases, dual reads or writes, fallbacks, feature flags, or migration layers.
- Update all in-repository consumers to the final interface immediately.
- Keep one canonical representation and one normal execution path.

## Comments

- Prefer focused decomposition and precise names that make code self-explanatory.
- Comment only decisions code cannot express, explaining why: external constraints, counterintuitive behavior, invariants, or significant tradeoffs.
- Remove comments that restate what code does, narrate obvious flow, or have become stale.

## Types and boundaries

- Carry precise types through input boundaries, internal flows, and output boundaries.
- Validate untrusted data at the boundary before use.
- Never write explicit or implicit `any` in TypeScript. Use `unknown`, then narrow it with a type guard or schema.
- Use type assertions and non-null assertions only when a runtime check or explicit invariant proves them safe.
- Model invalid states out of the core design where practical instead of repeatedly checking them downstream.

## Libraries

- Inspect the project's dependencies, documentation, and types before implementing common functionality or adding a package.
- Prefer an existing modern dependency when it already provides the capability cleanly.
- Otherwise prefer a mature, actively maintained, widely adopted library when it reduces total complexity or improves reliability.
- When adding a library, use the latest stable version compatible with the project's runtime, toolchain, and peer dependencies, and follow its current documentation.
- Avoid duplicate dependencies for the same capability. Implement a few lines of clear domain logic directly when that is smaller than another dependency.

import oxfmt from "ultracite/oxfmt";
import antiSlop from "ultracite/oxlint/anti-slop";
import core from "ultracite/oxlint/core";
import react from "ultracite/oxlint/react";
import tanstack from "ultracite/oxlint/tanstack";
import vitest from "ultracite/oxlint/vitest";
import { defineConfig } from "vite-plus";

const agentIgnorePatterns = [
  "**/.agent/**",
  "**/.agents/**",
  "**/.claude/**",
  "**/.codex/**",
  "**/.continue/**",
  "**/.cursor/**",
  "**/.gemini/**",
  "**/.opencode/**",
  "**/.pi/**",
  "**/.roo/**",
  "**/.windsurf/**",
];

export default defineConfig({
  fmt: {
    ...oxfmt,
    ignorePatterns: [...(oxfmt.ignorePatterns ?? []), ...agentIgnorePatterns],
  },
  lint: {
    extends: [core, react, tanstack, vitest, antiSlop],
    ignorePatterns: [...(core.ignorePatterns ?? []), ...agentIgnorePatterns],
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    options: { typeAware: true, typeCheck: true },
    overrides: [
      {
        files: ["apps/web/**"],
        rules: {
          "react/only-export-components": [
            "warn",
            {
              allowConstantExport: true,
              allowExportNames: ["Route"],
              customHOCs: [
                "createFileRoute",
                "createRootRoute",
                "createRootRouteWithContext",
              ],
            },
          ],
        },
      },
    ],
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",
    },
  },
  run: {
    cache: true,
  },
  staged: {
    "*": "vp check --fix",
  },
  test: {
    projects: [
      "apps/web",
      "apps/server",
      "apps/agents",
      "apps/desktop",
      "packages/api-client",
      "packages/logger",
      "packages/shared",
      "packages/utils",
    ],
  },
});

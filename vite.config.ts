import oxfmt from "ultracite/oxfmt";
import antiSlop from "ultracite/oxlint/anti-slop";
import core from "ultracite/oxlint/core";
import react from "ultracite/oxlint/react";
import shadcn from "ultracite/oxlint/shadcn";
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
    ignorePatterns: [
      ...(oxfmt.ignorePatterns ?? []),
      ...agentIgnorePatterns,
      "/AGENTS.md",
    ],
  },
  lint: {
    extends: [core, react, tanstack, vitest, antiSlop, shadcn],
    ignorePatterns: [
      ...(core.ignorePatterns ?? []),
      ...agentIgnorePatterns,
      "apps/web/src/components/assistant-ui/**",
      "apps/web/src/hooks/use-attachment-src.ts",
      "apps/web/src/hooks/use-copy-to-clipboard.ts",
    ],
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
      {
        files: ["packages/ui/src/components/**"],
        rules: {
          "eslint/func-style": "off",
          "react/function-component-definition": "off",
          "shadcn/no-arbitrary-values": "off",
          "shadcn/no-restyle": "off",
        },
      },
    ],
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",
    },
    settings: {
      shadcn: {
        ui: "@v-monorepo/ui/components",
      },
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
      "packages/electron",
      "packages/logger",
      "packages/shared",
      "packages/utils",
    ],
  },
});

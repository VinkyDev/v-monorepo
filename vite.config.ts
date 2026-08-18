import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: {
    ignorePatterns: [
      "**/routeTree.gen.ts",
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
      "tools/oxlint/anti-slop/**",
    ],
  },
  lint: {
    ignorePatterns: [
      "**/routeTree.gen.ts",
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
      "tools/oxlint/anti-slop/**",
    ],
    plugins: ["typescript", "oxc"],
    jsPlugins: [
      { name: "vite-plus", specifier: "vite-plus/oxlint-plugin" },
      { name: "anti-slop", specifier: "./tools/oxlint/anti-slop/index.ts" },
    ],
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",
      "anti-slop/no-chained-type-assertions": "error",
      "anti-slop/no-conditional-empty-object-spread": "error",
      "anti-slop/no-known-value-widening": "error",
      "anti-slop/no-module-mocking": "error",
      "anti-slop/no-object-parameters": "error",
      "anti-slop/no-reflect-apply": "error",
      "anti-slop/no-reflect-get": "error",
      "anti-slop/no-runtime-typeof": "error",
      "anti-slop/no-shape-in-symbol-names": "error",
      "anti-slop/no-unknown-parameters": "error",
      "anti-slop/no-unknown-returns": "error",
      "anti-slop/no-unknown-type-aliases": "error",
      "anti-slop/no-unsafe-dictionary-type": "error",
      "anti-slop/no-widen-then-assert": "error",
      "anti-slop/require-safety-comment-for-type-assertion": "error",
    },
    options: { typeAware: true, typeCheck: true },
    overrides: [
      {
        files: ["apps/web/**", "packages/ui/**"],
        plugins: ["react"],
        rules: {
          "react/rules-of-hooks": "error",
        },
      },
      {
        files: ["apps/web/**"],
        rules: {
          "react/only-export-components": [
            "warn",
            {
              allowConstantExport: true,
              allowExportNames: ["Route"],
              customHOCs: ["createFileRoute", "createRootRoute", "createRootRouteWithContext"],
            },
          ],
        },
      },
      {
        files: ["packages/ui/**"],
        rules: {
          "react/only-export-components": "off",
        },
      },
    ],
  },
  run: {
    cache: true,
  },
});

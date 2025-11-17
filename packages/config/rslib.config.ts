import type { LibConfig, RslibConfig } from '@rslib/core'

export const nodeLibConfig: LibConfig = {
  format: 'esm',
  syntax: ['node 18'],
  dts: true,
}

export function createRslibConfig(
  entry: string | Record<string, string | string[]> = './src/index.ts',
  lib: LibConfig[] = [nodeLibConfig],
): RslibConfig {
  const sourceEntry = typeof entry === 'string' ? { index: entry } : entry

  return {
    source: {
      entry: sourceEntry,
    },
    lib,
  }
}

export function createNodeLibConfig(
  entry: string | Record<string, string | string[]> = './src/index.ts',
): RslibConfig {
  return createRslibConfig(entry, [nodeLibConfig])
}

export function createReactLibConfig(
  entry: string | Record<string, string | string[]> = { index: ['./src/**'] },
  bundle = false,
): Omit<RslibConfig, 'plugins'> {
  const sourceEntry = typeof entry === 'string' ? { index: entry } : entry

  return {
    source: {
      entry: sourceEntry,
    },
    lib: [
      {
        bundle,
        dts: true,
        format: 'esm',
      },
    ],
    output: {
      target: 'web',
    },
  }
}

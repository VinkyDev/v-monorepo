import { resolve } from 'node:path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      target: 'node18',
      rollupOptions: {
        external: ['electron'],
      },
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },
    resolve: {
      alias: {
        utils: resolve('../../packages/utils/dist'),
        types: resolve('../../packages/types/dist'),
      },
    },
  },
  preload: {
    build: {
      target: 'node18',
      rollupOptions: {
        external: ['electron'],
      },
    },
    plugins: [externalizeDepsPlugin()],
  },
})

declare global {
  interface Window {
    electron: import('@electron-toolkit/preload').ElectronAPI
    api: unknown
  }
}

export {}

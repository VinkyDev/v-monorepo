import logger from 'logger'
import { setupClipboardHandlers } from './clipboardHandlers'

export async function ipcInit() {
  await Promise.all([
    setupClipboardHandlers(),
  ])

  logger.info('IPC initialized')
}

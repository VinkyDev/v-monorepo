import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppLazy } from './lazy'

import './index.css'
import 'ui/globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppLazy />
  </StrictMode>,
)

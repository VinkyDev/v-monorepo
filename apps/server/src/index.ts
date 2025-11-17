import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger as HonoLogger } from 'hono/logger'
import logger from 'logger'

const app = new Hono()

app.use('*', HonoLogger())
app.use('*', cors())

app.get('/', (c) => {
  return c.json({ message: 'Hello from Hono API!' })
})

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes
const api = new Hono()

api.get('/users', (c) => {
  return c.json({
    users: [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ],
  })
})

app.route('/api', api)

const port = Number(process.env.PORT) || 3000

logger.info(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port,
})

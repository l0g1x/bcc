import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import type { Placeholder } from '@beads-ide/shared'
import { health } from './routes/health.js'

const app = new Hono()

// Root endpoint
app.get('/', (c) => {
  const item: Placeholder = { id: 'beads-ide' }
  return c.json({ message: 'Beads IDE API', id: item.id })
})

// Register API routes
app.route('/api', health)

// Start server bound to localhost only (security requirement)
serve({
  fetch: app.fetch,
  hostname: '127.0.0.1',
  port: 3001,
})

console.log('Server running on http://127.0.0.1:3001')

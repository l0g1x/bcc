import type { Placeholder } from '@beads-ide/shared'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { beads } from './routes/beads.js'
import { cook } from './routes/cook.js'
import { formulas } from './routes/formulas.js'
import { graph } from './routes/graph.js'
import { health } from './routes/health.js'
import { pour } from './routes/pour.js'
import { sling } from './routes/sling.js'
import { workspace } from './routes/workspace.js'

const app = new Hono()

// Root endpoint
app.get('/', (c) => {
  const item: Placeholder = { id: 'beads-ide' }
  return c.json({ message: 'Beads IDE API', id: item.id })
})

// Register API routes
app.route('/api', health)
app.route('/api', beads)
app.route('/api', graph)
app.route('/api', cook)
app.route('/api', formulas)
app.route('/api', sling)
app.route('/api', pour)
app.route('/api', workspace)

// Start server bound to localhost only (security requirement)
serve({
  fetch: app.fetch,
  hostname: '127.0.0.1',
  port: 3001,
})

console.log('Server running on http://127.0.0.1:3001')

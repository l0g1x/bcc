import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import type { Placeholder } from '@beads-ide/shared'

const app = new Hono()

app.get('/', (c) => {
  const item: Placeholder = { id: 'beads-ide' }
  return c.json({ message: 'Beads IDE API', id: item.id })
})

serve({
  fetch: app.fetch,
  port: 3000,
})

console.log('Server running on http://localhost:3000')

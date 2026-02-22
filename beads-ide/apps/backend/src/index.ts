import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import type { ApiResponse } from '@beads-ide/shared'

const app = new Hono()

app.get('/', (c) => {
  const response: ApiResponse<{ name: string }> = {
    success: true,
    data: { name: 'Beads IDE API' },
  }
  return c.json(response)
})

serve({
  fetch: app.fetch,
  port: 3000,
})

console.log('Server running on http://localhost:3000')

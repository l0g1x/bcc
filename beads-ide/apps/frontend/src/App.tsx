import type { Placeholder } from '@beads-ide/shared'

export default function App() {
  const item: Placeholder = { id: 'beads-ide' }
  return <div>Beads IDE: {item.id}</div>
}

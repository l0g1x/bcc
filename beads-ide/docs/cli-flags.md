# CLI Flags Reference

This document describes the CLI flags used by the beads-ide backend to interact with `bd`, `gt`, and `bv` commands.

## bd (Beads CLI)

### `bd cook`

Cook transforms a formula file into a proto for inspection or persistence.

**Key flags:**
- `--json` - Output as JSON (default behavior, explicit flag ensures consistency)
- `--var KEY=VALUE` - Substitute variables at runtime
- `--mode=compile|runtime` - Compile-time keeps `{{vars}}`, runtime substitutes
- `--dry-run` - Preview steps without creating anything
- `--persist` - Write proto to database (not used by beads-ide)

**Example:**
```bash
bd cook formulas/explore-module.formula.toml --json
bd cook explore-module --var module_name=api --var depth=deep --json
```

**Output format (JSON):**
```json
{
  "formula": "explore-module",
  "version": 1,
  "type": "workflow",
  "vars": { ... },
  "steps": [ ... ]
}
```

### `bd show`

Display bead details.

**Example:**
```bash
bd show bcc-abc123
```

**Output:** Plain text formatted bead details (title, description, status, dependencies).

## bv (Beads Viewer)

### Graph Export

**Recommended: `--robot-graph`** (JSON to stdout)
```bash
bv --robot-graph --graph-format json
bv --robot-graph --graph-format dot
bv --robot-graph --graph-format mermaid
```

**Alternative: `--export-graph`** (writes to file)
```bash
bv --export-graph graph.html   # Interactive HTML
bv --export-graph graph.png    # Static PNG
bv --export-graph graph.svg    # Static SVG
```

**Note:** `--export-graph` does NOT support JSON format via `--output-format json`. For JSON output, use `--robot-graph` instead.

### Robot Commands (JSON output)

All `--robot-*` commands output JSON suitable for programmatic consumption:

- `--robot-graph` - Dependency graph as JSON/DOT/Mermaid
- `--robot-insights` - Graph analysis and insights
- `--robot-priority` - Priority recommendations
- `--robot-plan` - Dependency-respecting execution plan
- `--robot-triage` - Unified triage data

**Output format control:**
- `--format json` - Force JSON output (default for robot commands)
- `--graph-format json|dot|mermaid` - Graph-specific format

### Example Output

**`--robot-graph --graph-format json`:**
```json
{
  "nodes": [
    { "id": "bcc-abc", "title": "...", "status": "open", ... },
    ...
  ],
  "edges": [
    { "from": "bcc-abc", "to": "bcc-def", "type": "blocks" },
    ...
  ],
  "metrics": { ... }
}
```

**`--robot-insights`:**
```json
{
  "summary": { ... },
  "recommendations": [ ... ],
  "critical_path": [ ... ],
  "blocked_chains": [ ... ]
}
```

## gt (Gas Town)

### `gt hook`

Check currently hooked work for a polecat.

**Example:**
```bash
gt hook
```

**Output:** Plain text showing hooked bead/molecule details.

## beads-ide Usage

The backend uses these commands via the secure `cli.ts` wrapper which:

1. Uses `execFile` (not `exec`) to prevent shell injection
2. Validates all inputs against safe patterns
3. Sets appropriate timeouts (30s default, 60s for cook)
4. Resolves project root via `.beads/redirect`

### Wrapper Functions

```typescript
import { bdCook, bdShow, bvGraph, bvInsights, runCli } from './cli.js';

// Cook a formula to JSON
const result = await bdCook('explore-module', { module_name: 'api' });
const formula = JSON.parse(result.stdout);

// Get graph as JSON
const graph = await bvGraph('json');
const graphData = JSON.parse(graph.stdout);

// Generic CLI execution
const custom = await runCli('bv', ['--robot-insights']);
```

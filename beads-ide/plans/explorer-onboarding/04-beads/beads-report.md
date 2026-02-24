# Beads Report: explorer-onboarding

**Generated:** 2026-02-24
**Source plan:** plans/explorer-onboarding/03-plan/plan.md

---

## Creation Summary

| Level | Count |
|-------|-------|
| Feature epic | 1 |
| Phase sub-epics | 7 |
| Task issues | 30 |
| Blocker dependencies | 37 |
| Ready immediately (no blockers) | 7 |

---

## Bead ID Mapping

| Plan Reference | Bead ID | Type | Title |
|---------------|---------|------|-------|
| Feature | bcc-8rlwh | epic | explorer-onboarding |
| Phase 1 | bcc-8rlwh.1 | epic | Phase 1: Backend Foundation |
| Task 1.1 | bcc-8rlwh.1.1 | task | Add shared workspace types |
| Task 1.2 | bcc-8rlwh.1.2 | task | Add workspace root management to config.ts |
| Task 1.3 | bcc-8rlwh.1.3 | task | Create workspace routes file |
| Task 1.4 | bcc-8rlwh.1.4 | task | Register workspace routes |
| Task 1.5 | bcc-8rlwh.1.5 | task | Write backend unit tests |
| Phase 2 | bcc-8rlwh.2 | epic | Phase 2: Frontend State Layer |
| Task 2.1 | bcc-8rlwh.2.1 | task | Verify FormulaDirtyProvider presence |
| Task 2.2 | bcc-8rlwh.2.2 | task | Install @tanstack/react-virtual |
| Task 2.3 | bcc-8rlwh.2.3 | task | Create useWorkspaceConfig hook |
| Task 2.4 | bcc-8rlwh.2.4 | task | Create useTree hook |
| Task 2.5 | bcc-8rlwh.2.5 | task | Add startup workspace sync |
| Phase 3 | bcc-8rlwh.3 | epic | Phase 3: Welcome Panel & Onboarding Flow |
| Task 3.1 | bcc-8rlwh.3.1 | task | Create DirectoryBrowser component |
| Task 3.2 | bcc-8rlwh.3.2 | task | Create WelcomePanel component |
| Task 3.3 | bcc-8rlwh.3.3 | task | Create NewProjectModal component |
| Task 3.4 | bcc-8rlwh.3.4 | task | Update index.tsx for conditional welcome screen |
| Phase 4 | bcc-8rlwh.4 | epic | Phase 4: WorkspaceTree Component |
| Task 4.1 | bcc-8rlwh.4.1 | task | Create WorkspaceTree component |
| Task 4.2 | bcc-8rlwh.4.2 | task | Implement dirty state propagation |
| Task 4.3 | bcc-8rlwh.4.3 | task | Implement formula navigation |
| Task 4.4 | bcc-8rlwh.4.4 | task | Implement keyboard navigation |
| Task 4.5 | bcc-8rlwh.4.5 | task | Wire WorkspaceTree into sidebar |
| Phase 5 | bcc-8rlwh.5 | epic | Phase 5: Sidebar Header & Search |
| Task 5.1 | bcc-8rlwh.5.1 | task | Create WorkspaceHeader component |
| Task 5.2 | bcc-8rlwh.5.2 | task | Implement search filter |
| Task 5.3 | bcc-8rlwh.5.3 | task | Implement Change Folder flow |
| Task 5.4 | bcc-8rlwh.5.4 | task | Update sidebar collapse toggle |
| Task 5.5 | bcc-8rlwh.5.5 | task | Add document.title management |
| Phase 6 | bcc-8rlwh.6 | epic | Phase 6: Command Palette & Polish |
| Task 6.1 | bcc-8rlwh.6.1 | task | Add workspace actions to command palette |
| Task 6.2 | bcc-8rlwh.6.2 | task | Implement recent path validation |
| Task 6.3 | bcc-8rlwh.6.3 | task | Refresh useFormulas after workspace change |
| Phase 7 | bcc-8rlwh.7 | epic | Phase 7: Testing & Validation |
| Task 7.1 | bcc-8rlwh.7.1 | task | Write Playwright E2E tests |
| Task 7.2 | bcc-8rlwh.7.2 | task | Performance assertion |
| Task 7.3 | bcc-8rlwh.7.3 | task | Final cleanup and validation |

---

## Dependency Graph

```
Phase 1: Backend Foundation
  1.1 ──┬──→ 1.3 ──→ 1.4
  1.2 ──┘        └──→ 1.5

Phase 2: Frontend State Layer
  2.1 (independent)
  2.2 (independent)
  2.3 ──→ 2.5
  1.1 ──┬──→ 2.4
  1.4 ──┘

Phase 3: Welcome Panel & Onboarding Flow
  1.4 ──→ 3.1 ──┬──→ 3.2 ──→ 3.4
  2.3 ─────────┘
  1.4 ──→ 3.3

Phase 4: WorkspaceTree Component
  2.1 ──┬
  2.2 ──┼──→ 4.1 ──┬──→ 4.2 ──┬
  2.3 ──┤          ├──→ 4.3 ──┼──→ 4.5
  2.4 ──┘          └──→ 4.4 ──┘

Phase 5: Sidebar Header & Search
  4.5 ──→ 5.1 ──┬──→ 5.2
  3.1 ──────────┼──→ 5.3
               └──→ 5.3
  5.4 (independent)
  5.5 (independent)

Phase 6: Command Palette & Polish
  3.4 ──┬──→ 6.1
  5.3 ──┘
  3.2 ──→ 6.2
  3.4 ──┬──→ 6.3
  4.5 ──┘

Phase 7: Testing & Validation
  6.1 ──┬
  6.2 ──┼──→ 7.1 ──→ 7.2 ──┬──→ 7.3
  6.3 ──┘                 └──→ 7.3
```

---

## Ready Queue

Items with no blockers (can start immediately):

| Bead ID | Title | Phase |
|---------|-------|-------|
| bcc-8rlwh.1.1 | Add shared workspace types | Phase 1 |
| bcc-8rlwh.1.2 | Add workspace root management to config.ts | Phase 1 |
| bcc-8rlwh.2.1 | Verify FormulaDirtyProvider presence | Phase 2 |
| bcc-8rlwh.2.2 | Install @tanstack/react-virtual | Phase 2 |
| bcc-8rlwh.2.3 | Create useWorkspaceConfig hook | Phase 2 |
| bcc-8rlwh.5.4 | Update sidebar collapse toggle | Phase 5 |
| bcc-8rlwh.5.5 | Add document.title management | Phase 5 |

---

## Integration Branch

Feature epic: bcc-8rlwh
Integration branch: integration/explorer-onboarding

---

## Coverage Verification

| Plan Task | Bead ID | Status |
|-----------|---------|--------|
| 1.1 Add shared workspace types | bcc-8rlwh.1.1 | Created |
| 1.2 Add workspace root management to config.ts | bcc-8rlwh.1.2 | Created |
| 1.3 Create workspace routes file | bcc-8rlwh.1.3 | Created |
| 1.4 Register workspace routes | bcc-8rlwh.1.4 | Created |
| 1.5 Write backend unit tests | bcc-8rlwh.1.5 | Created |
| 2.1 Verify FormulaDirtyProvider presence | bcc-8rlwh.2.1 | Created |
| 2.2 Install @tanstack/react-virtual | bcc-8rlwh.2.2 | Created |
| 2.3 Create useWorkspaceConfig hook | bcc-8rlwh.2.3 | Created |
| 2.4 Create useTree hook | bcc-8rlwh.2.4 | Created |
| 2.5 Add startup workspace sync | bcc-8rlwh.2.5 | Created |
| 3.1 Create DirectoryBrowser component | bcc-8rlwh.3.1 | Created |
| 3.2 Create WelcomePanel component | bcc-8rlwh.3.2 | Created |
| 3.3 Create NewProjectModal component | bcc-8rlwh.3.3 | Created |
| 3.4 Update index.tsx for conditional welcome screen | bcc-8rlwh.3.4 | Created |
| 4.1 Create WorkspaceTree component | bcc-8rlwh.4.1 | Created |
| 4.2 Implement dirty state propagation | bcc-8rlwh.4.2 | Created |
| 4.3 Implement formula navigation | bcc-8rlwh.4.3 | Created |
| 4.4 Implement keyboard navigation | bcc-8rlwh.4.4 | Created |
| 4.5 Wire WorkspaceTree into sidebar | bcc-8rlwh.4.5 | Created |
| 5.1 Create WorkspaceHeader component | bcc-8rlwh.5.1 | Created |
| 5.2 Implement search filter | bcc-8rlwh.5.2 | Created |
| 5.3 Implement Change Folder flow | bcc-8rlwh.5.3 | Created |
| 5.4 Update sidebar collapse toggle | bcc-8rlwh.5.4 | Created |
| 5.5 Add document.title management | bcc-8rlwh.5.5 | Created |
| 6.1 Add workspace actions to command palette | bcc-8rlwh.6.1 | Created |
| 6.2 Implement recent path validation | bcc-8rlwh.6.2 | Created |
| 6.3 Refresh useFormulas after workspace change | bcc-8rlwh.6.3 | Created |
| 7.1 Write Playwright E2E tests | bcc-8rlwh.7.1 | Created |
| 7.2 Performance assertion | bcc-8rlwh.7.2 | Created |
| 7.3 Final cleanup and validation | bcc-8rlwh.7.3 | Created |

**Plan tasks:** 30
**Beads created:** 30
**Coverage:** 100%

---

## Review Passes

| Pass | Result | Fixes Applied |
|------|--------|---------------|
| 1. Completeness | PASS | 0 |
| 2. Dependencies | FAIL → Fixed | 4 |
| 3. Clarity | FAIL → Fixed | 8 |

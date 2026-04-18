# Story Graph Editor — Design

Companion to [`story-graph.md`](./story-graph.md). This document covers the **editor** workspace at `editor/` — the visual, browser-based tool directors use to author and maintain `story.json`.

Status: **M4 complete.** The editor round-trips `stories/perfect-neighbor-demo/story.json`: load → visualize → edit → save → play.

---

## Purpose

The player alone is enough to *run* an interactive drama, but not to *build* one. A hand-edited `story.json` fails silently in ways that aren't obvious until you try to walk the graph by hand:

- typo in a `next` field dangles a branch;
- a hub's `advanceWhen` condition references a flag nobody mutates, so the hub never advances;
- a newly added ending has an unreferenced `outcome` string;
- nodes exist in the file but have no incoming edges.

The editor replaces hand-editing with a view where these problems are immediately visible (as validation errors or as unreachable nodes on the canvas) and a sidebar where a director can fix them without opening the JSON.

---

## Scope (v1 / current milestone)

### In
- Load a `story.json` file; bootstrap with `stories/perfect-neighbor-demo/story.json` on startup.
- Visualize the full graph on a zoomable / pannable canvas, laid out using stored positions or a grid fallback.
- Color nodes by `kind` (N / H / D / C); style edges by semantic variant (linear, choice, hub-advance, hotspot, qte success / fail).
- Click a node to open a sidebar inspector with per-type form editors.
- Live schema validation with inline error list.
- Save the edited story back to disk via a browser download (positions are persisted in `story.editor.positions`).

### Out
- In-editor video playback. The sidebar exposes the `video.src` path as a text field; preview happens in the player.
- Creating / deleting nodes from the canvas. v1 edits only existing nodes; use hand-written scaffolding to add new ones, then edit them here. (Planned for v2.)
- Drag-to-connect edges. Edges are derived from interaction fields; editing the `next` / `choices` fields in the inspector updates the edges. (Direct edge drawing is also planned for v2.)
- Undo / redo beyond what React Flow provides for free.
- Multi-author / cloud sync. Single-author, local file.

---

## Workspace Layout

```
editor/
├── index.html
├── package.json                # @ivd/editor workspace; depends on @ivd/shared
├── tsconfig.json               # strict, react-jsx, noEmit
├── vite.config.ts              # fs.allow widened to repo root
└── src/
    ├── main.tsx                # createRoot, StrictMode, styles.css
    ├── App.tsx                 # top-level layout + state
    ├── styles.css              # global dark theme + react-flow overrides
    ├── Toolbar.tsx             # title, load, download, validation badge
    ├── ValidationPanel.tsx     # red error drawer
    ├── io.ts                   # downloadStory, loadStoryFromFile
    ├── canvas/
    │   ├── graph.ts            # story ↔ React Flow conversion
    │   ├── StoryCanvas.tsx     # React Flow + event wiring
    │   └── StoryNode.tsx       # custom kind-colored node
    └── inspector/
        ├── Inspector.tsx       # sidebar shell; node-level fields
        ├── InteractionEditor.tsx  # per-interaction-type forms
        └── fields.tsx          # shared field primitives / styles
```

The editor depends on `@ivd/shared` for the schema / types / validator — never forks them. Vite's `server.fs.allow` is widened to the repo root so it can also import the bootstrap `story.json` directly from `stories/`.

---

## Data Flow

```
 story.json (disk)
      │  load (file input)
      ▼
 Story (state in App.tsx)  ◀────────┐
      │                             │
      │  storyToNodes / storyToEdges│  writePositions,
      │                             │  inspector edits,
      ▼                             │  JSON textarea parse
 React Flow state (useNodesState)   │
      │  onNodesChange              │
      │  onNodeClick / onPaneClick  │
      └─────────────────────────────┘
      │  download
      ▼
 story.json (disk)
```

Single source of truth: the `Story` object in `App.tsx`. Every edit — dragging a node, changing a label, editing a choice — produces a new `Story` via `onStoryChange`. The canvas and inspector are *views* of that object; they never hold authoritative state.

This is what makes live validation cheap: `StorySchema.safeParse(story)` runs on every state change inside a `useMemo`, and the error list feeds both the toolbar badge and the bottom error panel.

---

## Graph Conversion (`canvas/graph.ts`)

The story is not stored as an explicit node-and-edge graph; edges are **derived** from interaction fields. This avoids a whole class of drift bugs — the canvas can never show an edge the runtime wouldn't also follow.

### `storyToNodes(story): RFNode[]`
One React Flow node per `story.nodes` entry. Position resolves in this order:
1. `story.editor.positions[id]` if present.
2. Grid layout fallback — 4 columns × 260 px, rows 140 px apart, in iteration order of `story.nodes`.

### `storyToEdges(story): Edge[]`
Walks each interaction and emits edges:

| Interaction type | Edges produced |
|---|---|
| `linear` | 1 edge → `next`, variant `linear` |
| `tilt-look` | 1 edge → `next`, variant `linear` |
| `choice` | N edges, one per `choices[i]`, variant `choice`, label = choice label |
| `hub` | N `choice` edges + 1 dashed `advance` edge → `advanceTo` |
| `tap-hotspot` | N edges, one per hotspot, variant `hotspot` |
| `qte` | 2 edges: `onSuccess` (green) and `onFail` (red) |
| `ending` | 0 edges |

Edge id format `${sourceId}->${targetId}#${index}` keeps parallel edges distinct.

### `writePositions(story, rfNodes): Story`
On drag-end, the canvas calls this to snapshot current positions into `story.editor.positions`. `editor.positions` is the only field the editor owns; the rest of the story is the director's.

---

## Canvas (`canvas/StoryCanvas.tsx`)

Thin wrapper over `<ReactFlow>`:

- **Node types:** single registered type `storyNode` → `StoryNode.tsx`. Shows the kind badge (N / H / D / C), the node id, the label, and the interaction type.
- **Kind colors:** N = slate, H = amber, D = crimson, C = sky. Chosen for contrast on the dark background; also drive the minimap tint.
- **Selection:** handled with `onNodeClick` (sets selected id) and `onPaneClick` (clears it) rather than React Flow's `onSelectionChange`, which was not firing reliably on simple clicks. The `selected` prop is re-derived from the parent's `selectedId` state, so selection survives re-renders driven by edits.
- **Drag persistence:** `onNodesChange` filters for `type === 'position' && dragging === false`, then calls `writePositions` → `onStoryChange`. This means dragging doesn't stutter on every frame (no upstream state churn mid-drag) but the final position is persisted immediately.
- **Always-visible chrome:** `<Background>`, `<Controls>`, and a pannable `<MiniMap>`.

---

## Inspector (`inspector/`)

The inspector mounts only when a node is selected. Rendering it unconditionally was the original design but created visual noise and wasted 340 px on every view; clicking empty canvas now collapses it entirely, and the `×` button in its header does the same.

### Node-level fields (`Inspector.tsx`)
- `label` (text)
- `kind` (select — N / H / C / D with friendly names, e.g. `N — Narrative`; stored as single letter to match the schema)
- `video.src` (text)
- `video.sourceAspect` (number)
- `video.loop` (checkbox)

### Interaction-level fields (`InteractionEditor.tsx`)

Per-type forms:

| Type | Fields |
|---|---|
| `linear` | `next` (node select) |
| `tilt-look` | `next`, `maxAngleDeg`, `zoom` |
| `choice` | dynamic list of `{ id, label, next }` with add/remove |
| `hub` | choices list + `advanceTo` + `advanceWhen` (JSON textarea) |
| `ending` | `outcome` text |
| `tap-hotspot` / `qte` | raw JSON textarea (renderers not yet implemented) |

Changing the type via the top-level dropdown replaces the interaction with a default-shaped object for that type (preserving the current outgoing target as the default next-id), so the graph never enters an invalid intermediate state.

### Why a JSON textarea for `advanceWhen` and the stub types

`Condition` is a recursive AST and `tap-hotspot` / `qte` aren't playable yet. Building form editors for shapes that don't have renderers would be premature, and directors who want to author these rare fields today can do it precisely in JSON with the schema validator catching mistakes live. The `onBlur`-parses-JSON pattern keeps invalid syntax from corrupting state — on parse failure, the previous valid value is retained.

### Node selects
Every "pick a target node" dropdown enumerates `Object.keys(story.nodes)`. If the current value isn't in that list (because a node was renamed or loaded from an inconsistent file), it's prepended so the user can see the dangling reference rather than it silently snapping to the first valid node.

---

## Toolbar + Validation Panel

- **Toolbar** (`Toolbar.tsx`): title + version, `Load JSON` (file picker), `Download JSON` (serialize + browser download), and a green / red validity badge.
- **ValidationPanel** (`ValidationPanel.tsx`): a red drawer beneath the canvas showing per-path schema errors. Combines file-load errors and live schema errors into a single list.

Both use `@ivd/shared`'s `StorySchema` / `validateStory` so the editor and player agree on what "valid" means.

---

## Key Design Decisions

**Shared schema, not duplicated types.** The editor's `package.json` depends on `@ivd/shared` at workspace version `*`. Any schema change in `shared/` ripples into both editor and player in the same commit.

**Edges derived, not stored.** Eliminating the stored edge list removes the possibility of the canvas showing something the runtime wouldn't follow. Positions are the only editor-owned field in `story.json`.

**Positions live in the story file, not a sidecar.** Simpler: one file to share, one file to version. Namespaced under `story.editor.positions` so it's obvious which fields are authoring-only; optional in the schema so hand-written stories without layout data still load.

**State owned by `App.tsx`, not React Flow.** The canvas and inspector are views. Every edit flows through a single `setStory`. This makes validation trivial, round-tripping obvious, and undo / redo viable as a future addition (just stack `Story` snapshots).

**Inspector mounts only when a node is selected.** Empty-state noise was worse than the layout shift; the canvas now fills the screen by default.

**Single-letter kinds, friendly labels.** The schema requires `N / H / D / C` (matches the screenplay's node prefix convention). The inspector dropdown renders `N — Narrative`, `H — Hub`, etc. for readability without touching the stored value.

---

## Known Limitations

- No node create / delete / rename from the canvas. Works around this with hand-editing the JSON before loading.
- No drag-to-connect edges. Editing targets via the inspector covers the same ground at the cost of an extra click.
- No undo/redo. Live-validation catches most errors; `Load JSON` can recover from a corrupted session.
- `Condition` and stub-type editing is JSON-only. Fine for v1's single author; revisit when/if more authors or more complex conditions land.
- Download-only save. Overwriting the in-repo `story.json` requires manually moving the downloaded file. The File System Access API is the obvious upgrade when it's worth the browser-support carveout.

---

## Running

```
npm run editor   # from repo root; starts vite on http://localhost:5173
npm run app      # separately, to play the same story on Expo
```

`npm run validate-story` re-runs the schema validator on the bootstrap story from the CLI — useful in CI / pre-commit hooks once those exist.

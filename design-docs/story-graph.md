# Story Graph System — Design

This doc describes the system that lets a director stitch many video scenes into a branching interactive drama in the style of *Until Dawn*. Companion doc: [`architecture.md`](./architecture.md) describes one specific scene-level interaction that this system will consume.

Status: **M1–M4 complete.** Lives on branch `feature/story-graph-editor`. Reference screenplay: [`screenplay/Perfect Neighbor Demo Plot Line.pdf`](../screenplay/Perfect%20Neighbor%20Demo%20Plot%20Line.pdf). Editor-specific design: [`story-graph-editor.md`](./story-graph-editor.md).

---

## Concept

The director authors the drama as a **directed graph** in a visual canvas editor:

- Each **node** references a video clip and declares an interaction type (e.g. `linear`, `choice`, `hub`, `tilt-look`, `tap-hotspot`, `qte`, `ending`). The interaction type determines what the viewer does while / after the video plays.
- Each **edge** declares how the viewer advances to the next node — either unconditionally (for `linear`), by choosing an option (for `choice` / `hub`), or by satisfying a condition over story state flags.
- A shared **`story.json`** file is the single artifact the editor writes and the player reads. Both sides validate it against one TypeScript schema.

The player is the existing Expo app, extended with a `StoryEngine` that walks the graph at runtime. The editor is a new Vite + React Flow web app that edits the graph visually.

---

## Goals & Non-Goals

### Goals (v1)
- Author a story graph visually; export `story.json`.
- Runtime plays video → collects input → transitions to next node.
- Support these node types: `linear`, `choice`, `hub`, `tilt-look`, `ending`.
- Flag-based story state (e.g. `sawBodyBag`, `reviewedAnnouncement`) with conditional edges.
- Pluggable `InteractionRenderer` interface so new interaction types (tap-hotspot, QTE, etc.) can be added without touching the engine.

### Non-goals (v1)
- Multi-author collaboration or cloud storage. Single-author, local file.
- In-editor video preview / playback. Editor is graph-only; test in the player.
- Live reload between editor and player. Round-trip via saved file.
- Localization pipeline. Dialogue text lives on nodes as plain strings for now.
- Production-grade condition DSL. Start with `flag === value`-style declarative conditions; expand only if directors hit the ceiling.

---

## System Overview

```
┌──────────────────────────┐        ┌──────────────────────────┐
│  Editor  (Vite + React)  │        │  Player  (Expo / existing)│
│  - React Flow canvas     │        │  - StoryEngine            │
│  - Node inspector panel  │        │  - InteractionRenderers   │
│  - Save / Load story.json│        │                           │
└────────────┬─────────────┘        └────────────▲─────────────┘
             │ writes                             │ reads
             ▼                                    │
           ┌──────────────────────────────────────┴───┐
           │  stories/<name>.json                     │
           │  (single source of truth)                │
           └─────────────────┬────────────────────────┘
                             │ validated by
                             ▼
           ┌──────────────────────────────────────────┐
           │  shared/  — TypeScript types + Zod schema│
           │  imported by BOTH editor and player      │
           └──────────────────────────────────────────┘
```

The `shared/` package exists specifically to make schema drift impossible: if the editor adds a field, the player's types change in the same commit.

---

## Repository Structure

Same repo. Same-repo is chosen because the editor and player share the `story.json` schema; split repos would introduce a versioning problem without a matching benefit for a single-author workflow.

Target layout after the restructure:

```
interactive-video-demo/
├── app/                          # Expo player (existing code moves here)
│   ├── App.tsx
│   ├── app.json
│   ├── index.ts
│   ├── package.json              # expo, expo-video, expo-sensors, …
│   ├── tsconfig.json
│   └── src/
│       ├── engine/               # NEW: StoryEngine, state, transitions
│       ├── interactions/         # NEW: one folder per InteractionRenderer
│       │   ├── tilt-look/        # ← existing useDeviceOrientation + WindowViewer
│       │   ├── linear/
│       │   ├── choice/
│       │   ├── hub/
│       │   └── ending/
│       ├── hooks/                # existing useDeviceOrientation
│       └── components/           # existing WindowViewer, DebugOverlay
├── editor/                       # NEW: Vite + React + React Flow
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── canvas/               # React Flow graph + custom node components
│       ├── inspector/            # Sidebar: edit selected node's fields
│       ├── io/                   # Load / save story.json
│       └── App.tsx
├── shared/                       # NEW: schema + types, consumed by both
│   ├── package.json
│   └── src/
│       ├── schema.ts             # Zod schema for story.json
│       ├── types.ts              # TS types derived from schema
│       └── validate.ts           # Loader with validation
├── stories/                      # NEW: one folder per story
│   └── perfect-neighbor-demo/
│       └── story.json
├── videos/                       # Existing — referenced by story.json
├── screenplay/                   # Existing — director reference PDFs
└── design-docs/
    ├── architecture.md           # Scene-level runtime (existing)
    └── story-graph.md            # This file
```

**Workspace wiring:** use npm workspaces (simplest, no extra tooling) with `app/`, `editor/`, and `shared/` as workspace packages. Root `package.json` declares the workspaces; `shared` is a dependency of both.

---

## Data Model

The `story.json` schema (authoritative definition will be Zod in `shared/src/schema.ts`):

```ts
type Story = {
  id: string;                      // "perfect-neighbor-demo"
  title: string;
  version: number;                 // bumped on breaking schema changes
  initialNodeId: NodeId;
  initialFlags: Record<string, FlagValue>;
  nodes: Record<NodeId, Node>;
};

type NodeId = string;              // "N-000", "H-010", "D-031", …
type FlagValue = boolean | number | string;

type Node = {
  id: NodeId;
  label: string;                   // "N-000 Iris Move-In Date"
  kind: 'N' | 'H' | 'D' | 'C';     // screenplay prefix (for editor color-coding)
  video: VideoRef;                 // clip that plays when entering the node
  interaction: Interaction;        // what happens after / during the video
  onEnter?: FlagMutation[];        // e.g. set reviewedAnnouncement = true
  director?: DirectorNotes;        // non-runtime metadata (photography, sound)
};

type VideoRef = {
  src: string;                     // relative path: "videos/room.mp4"
  sourceAspect: number;            // 1.0 for room.mp4
  loop?: boolean;                  // default false; true for ambient nodes
};

type Interaction =
  | { type: 'linear';      next: NodeId }
  | { type: 'tilt-look';   next: NodeId; maxAngleDeg: number; zoom: number }
  | { type: 'choice';      choices: Choice[]; timeoutMs?: number; defaultChoiceId?: string }
  | { type: 'hub';         choices: Choice[]; advanceWhen: Condition; advanceTo: NodeId }
  | { type: 'tap-hotspot'; hotspots: Hotspot[] }       // v1 stub
  | { type: 'qte';         window: { startMs: number; endMs: number }; onSuccess: NodeId; onFail: NodeId }  // v1 stub
  | { type: 'ending';      outcome: 'survive' | 'death' | string };

type Choice = {
  id: string;
  label: string;
  next: NodeId;
  condition?: Condition;           // only show choice if condition holds
  onSelect?: FlagMutation[];       // e.g. set reviewedAnnouncement = true
};

type Condition =
  | { op: 'eq' | 'neq'; flag: string; value: FlagValue }
  | { op: 'all'; conditions: Condition[] }             // AND
  | { op: 'any'; conditions: Condition[] };            // OR

type FlagMutation = { flag: string; value: FlagValue };

type DirectorNotes = {
  sceneLocation?: string;
  timeOfDay?: string;
  photography?: string;
  soundDesign?: string[];
  beats?: string[];
};
```

### Why these choices

- **Dialogue in `director`, not runtime.** The screenplay mixes director-only notes (camera lens choices) with runtime content (sound cues). We put all director notes in `director` as plain strings; runtime sound/subtitle support is a separate future concern, not v1.
- **`Condition` is a tiny AST, not a string expression.** Avoids building a parser. Covers the hub-gate case (`all [reviewedPie, reviewedBoard, reviewedGroupChat]`) and simple flag checks. Expand if/when directors need more.
- **`hub` is its own type, not `choice` + magic.** The "all-must-be-visited-before-advancing" pattern from H-010 is core to the screenplay and warrants a first-class type rather than being emulated with conditions on every sub-choice.
- **`tap-hotspot` and `qte` shipped as schema stubs.** Renderers won't exist in v1, but committing the schema now prevents a breaking change when they're implemented.

---

## Runtime: StoryEngine

```
┌────────────────────────────────────────────────────────────┐
│ StoryEngine                                                │
│ ─────────                                                  │
│ state:                                                     │
│   currentNodeId: NodeId                                    │
│   flags: Record<string, FlagValue>                         │
│   hubVisits: Record<NodeId, Set<ChoiceId>>                 │
│                                                            │
│ on enter(node):                                            │
│   applyMutations(node.onEnter)                             │
│   render InteractionRenderer[node.interaction.type]        │
│                                                            │
│ on renderer emits `transition(nextNodeId, mutations?)`:    │
│   applyMutations(mutations)                                │
│   currentNodeId = nextNodeId                               │
│   enter(nodes[nextNodeId])                                 │
└────────────────────────────────────────────────────────────┘
```

### InteractionRenderer contract

Every interaction type implements the same interface:

```ts
type InteractionRenderer<I extends Interaction> = (props: {
  node: Node;
  interaction: I;
  flags: Record<string, FlagValue>;
  hubVisits: Set<string>;                    // for hub nodes only
  onTransition: (next: NodeId, mutations?: FlagMutation[]) => void;
}) => React.ReactElement;
```

The registry is a single object in `app/src/engine/renderers.ts`:

```ts
export const renderers: Record<Interaction['type'], InteractionRenderer<any>> = {
  linear:      LinearRenderer,
  'tilt-look': TiltLookRenderer,        // thin wrapper over existing App.tsx logic
  choice:      ChoiceRenderer,
  hub:         HubRenderer,
  ending:      EndingRenderer,
  // v1 stubs — register, render "unsupported" placeholder
  'tap-hotspot': UnsupportedRenderer,
  qte:           UnsupportedRenderer,
};
```

**Tilt-look preservation:** the existing `useDeviceOrientation` + `WindowViewer` code is not touched. `TiltLookRenderer` is a wrapper that reads `interaction.maxAngleDeg` / `interaction.zoom` and feeds them to the existing component tree. Once its video ends (or on a tap, TBD), it calls `onTransition(interaction.next)`.

---

## Editor

React Flow (xyflow) + Vite + React. Reads and writes `story.json` via a file input + download link (works in every browser). Full design: [`story-graph-editor.md`](./story-graph-editor.md).

High-level shape:
- Canvas with kind-colored nodes (N / H / D / C) and variant-styled edges (linear / choice / advance / hotspot / qte-success / qte-fail).
- Side-panel inspector opened by clicking a node; closed via a `×` button or a click on empty canvas.
- Per-interaction-type editor (linear / tilt-look / choice / hub / ending); `tap-hotspot` and `qte` fall back to a raw-JSON textarea until their renderers exist.
- Live schema validation badge in the toolbar; full error list surfaced in a red panel beneath the canvas.

---

## Example: First 5 Nodes of "Perfect Neighbor"

Hand-authored `story.json` fragment used as the validation target for milestone 1:

```json
{
  "id": "perfect-neighbor-demo",
  "title": "Perfect Neighbor — Demo",
  "version": 1,
  "initialNodeId": "N-000",
  "initialFlags": {
    "reviewedPie": false,
    "reviewedBoard": false,
    "reviewedGroupChat": false
  },
  "nodes": {
    "N-000": {
      "id": "N-000", "label": "Iris Move-In Date", "kind": "N",
      "video": { "src": "videos/n-000-move-in.mp4", "sourceAspect": 1.778 },
      "interaction": { "type": "linear", "next": "H-010" }
    },
    "H-010": {
      "id": "H-010", "label": "Welcome to the Community", "kind": "H",
      "video": { "src": "videos/h-010-kitchen.mp4", "sourceAspect": 1.778 },
      "interaction": {
        "type": "hub",
        "choices": [
          { "id": "c1", "label": "Return the pie plate to Evan",
            "next": "N-011", "onSelect": [{ "flag": "reviewedPie", "value": true }] },
          { "id": "c2", "label": "Check community announcement",
            "next": "N-012", "onSelect": [{ "flag": "reviewedBoard", "value": true }] },
          { "id": "c3", "label": "View neighborhood group chat",
            "next": "N-013", "onSelect": [{ "flag": "reviewedGroupChat", "value": true }] }
        ],
        "advanceWhen": {
          "op": "all",
          "conditions": [
            { "op": "eq", "flag": "reviewedPie", "value": true },
            { "op": "eq", "flag": "reviewedBoard", "value": true },
            { "op": "eq", "flag": "reviewedGroupChat", "value": true }
          ]
        },
        "advanceTo": "N-020"
      }
    },
    "N-011": { "...": "returns to H-010 via linear" },
    "N-012": { "...": "returns to H-010 via linear" },
    "N-013": { "...": "returns to H-010 via linear" }
  }
}
```

This is the proof that the schema covers the most structurally complex pattern in the screenplay.

---

## Milestones

| # | Deliverable | Covers | Status |
|---|---|---|---|
| 1 | Monorepo restructure + `shared/` package + hand-written `stories/perfect-neighbor-demo/story.json`. | Schema, layout, validation. | ✅ done |
| 2 | `StoryEngine` + `linear`, `choice`, `ending` renderers in the player. The hand-written story is playable end-to-end for those node types. | Core runtime loop, flag state. | ✅ done |
| 3 | `hub` renderer + `tilt-look` renderer wrapping the existing tilt code. N-020 (the tilt-the-blinds scene) is playable as a `tilt-look` node. | Preserves existing work; validates plugin interface. | ✅ done |
| 4 | Editor MVP: React Flow canvas, node inspector, save/load, schema validation. Round-trip: edit the hand-written story in the editor, save, play. | Authoring workflow. | ✅ done |
| 5 | `tap-hotspot` + `qte` renderers; richer conditions if directors need them. | Fills out the interaction taxonomy. | pending |

Each milestone ends in a playable state — no dead-end intermediate commits.

---

## Open Questions

- **Transition trigger on `linear` / `tilt-look`:** when the video ends? On tap? Both, configurable? Default to "when video ends"; add an optional `tapToAdvance: true` field if directors ask.
- **`choice` timing:** always untimed in v1, or support `timeoutMs` + `defaultChoiceId` now? Leaning toward including the fields in the schema but not enforcing the timer in the renderer yet.
- **Video storage location:** `videos/` at root, or per-story (`stories/<name>/videos/`)? Per-story scales better once there are multiple stories; root is simpler for the demo. Starting with root; revisit when a second story exists.
- **Story state persistence:** should progress survive app restart (e.g. resume at current node)? Not in v1.

---

## Relationship to `architecture.md`

`architecture.md` documents the sensor-pipeline and `WindowViewer` that power a **single** tilt-look scene. That document is unchanged by this proposal. The `TiltLookRenderer` introduced here is a thin adapter that invokes exactly the component tree described in `architecture.md`, parameterized by the `maxAngleDeg` / `zoom` / `sourceAspect` values declared on the node.

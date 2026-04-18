import type { Edge, Node as RFNode } from '@xyflow/react';
import type { Interaction, Position, Story } from '@ivd/shared';

export type StoryNodeData = {
  label: string;
  kind: 'N' | 'H' | 'D' | 'C';
  interactionType: Interaction['type'];
};

export type StoryRFNode = RFNode<StoryNodeData, 'storyNode'>;

const COL_WIDTH = 260;
const ROW_HEIGHT = 140;
const COLS = 4;

export function gridLayout(ids: string[]): Record<string, Position> {
  const out: Record<string, Position> = {};
  ids.forEach((id, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    out[id] = { x: col * COL_WIDTH, y: row * ROW_HEIGHT };
  });
  return out;
}

export function storyToNodes(story: Story): StoryRFNode[] {
  const ids = Object.keys(story.nodes);
  const saved = story.editor?.positions ?? {};
  const fallback = gridLayout(ids);
  return ids.map((id) => {
    const node = story.nodes[id]!;
    const pos = saved[id] ?? fallback[id]!;
    return {
      id,
      type: 'storyNode',
      position: { x: pos.x, y: pos.y },
      data: {
        label: node.label,
        kind: node.kind,
        interactionType: node.interaction.type,
      },
    };
  });
}

type OutEdge = {
  target: string;
  label?: string;
  variant: 'linear' | 'choice' | 'advance' | 'qteSuccess' | 'qteFail' | 'hotspot';
};

function interactionEdges(interaction: Interaction): OutEdge[] {
  switch (interaction.type) {
    case 'linear':
      return [{ target: interaction.next, variant: 'linear' }];
    case 'tilt-look':
      return [{ target: interaction.next, variant: 'linear' }];
    case 'choice':
      return interaction.choices.map((c) => ({
        target: c.next,
        label: c.label,
        variant: 'choice',
      }));
    case 'hub': {
      const choiceEdges: OutEdge[] = interaction.choices.map((c) => ({
        target: c.next,
        label: c.label,
        variant: 'choice',
      }));
      choiceEdges.push({
        target: interaction.advanceTo,
        label: 'advance',
        variant: 'advance',
      });
      return choiceEdges;
    }
    case 'tap-hotspot':
      return interaction.hotspots.map((h) => ({
        target: h.next,
        label: h.label ?? h.id,
        variant: 'hotspot',
      }));
    case 'qte':
      return [
        { target: interaction.onSuccess, label: 'success', variant: 'qteSuccess' },
        { target: interaction.onFail, label: 'fail', variant: 'qteFail' },
      ];
    case 'ending':
      return [];
  }
}

export function storyToEdges(story: Story): Edge[] {
  const edges: Edge[] = [];
  for (const [nodeId, node] of Object.entries(story.nodes)) {
    const outs = interactionEdges(node.interaction);
    outs.forEach((o, i) => {
      edges.push({
        id: `${nodeId}->${o.target}#${i}`,
        source: nodeId,
        target: o.target,
        label: o.label,
        data: { variant: o.variant },
        animated: o.variant === 'advance',
        style: edgeStyle(o.variant),
      });
    });
  }
  return edges;
}

function edgeStyle(variant: OutEdge['variant']): React.CSSProperties {
  switch (variant) {
    case 'advance':
      return { stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '6 4' };
    case 'qteSuccess':
      return { stroke: '#22c55e', strokeWidth: 2 };
    case 'qteFail':
      return { stroke: '#ef4444', strokeWidth: 2 };
    case 'choice':
      return { stroke: '#60a5fa', strokeWidth: 1.5 };
    case 'hotspot':
      return { stroke: '#a78bfa', strokeWidth: 1.5 };
    case 'linear':
    default:
      return { stroke: '#9ca3af', strokeWidth: 1.5 };
  }
}

export function writePositions(story: Story, nodes: StoryRFNode[]): Story {
  const positions: Record<string, Position> = {};
  for (const n of nodes) {
    positions[n.id] = { x: Math.round(n.position.x), y: Math.round(n.position.y) };
  }
  return {
    ...story,
    editor: { ...(story.editor ?? {}), positions },
  };
}

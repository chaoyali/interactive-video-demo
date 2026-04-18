import { useCallback, useEffect, useMemo } from 'react';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type NodeChange,
  type OnNodesChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Story } from '@ivd/shared';
import { StoryNode } from './StoryNode';
import { storyToEdges, storyToNodes, writePositions, type StoryRFNode } from './graph';

const nodeTypes = { storyNode: StoryNode };

type Props = {
  story: Story;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onStoryChange: (story: Story) => void;
};

export function StoryCanvas({ story, selectedId, onSelect, onStoryChange }: Props) {
  const initialNodes = useMemo(() => storyToNodes(story), [story]);
  const initialEdges = useMemo(() => storyToEdges(story), [story]);

  const [nodes, setNodes, onNodesChangeRaw] = useNodesState<StoryRFNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(storyToNodes(story));
    setEdges(storyToEdges(story));
  }, [story, setNodes, setEdges]);

  const onNodesChange: OnNodesChange<StoryRFNode> = useCallback(
    (changes: NodeChange<StoryRFNode>[]) => {
      onNodesChangeRaw(changes);
      const hasMove = changes.some(
        (c) => c.type === 'position' && c.dragging === false
      );
      if (hasMove) {
        setNodes((current) => {
          onStoryChange(writePositions(story, current));
          return current;
        });
      }
    },
    [onNodesChangeRaw, setNodes, story, onStoryChange]
  );

  const handleNodeClick = useCallback(
    (_e: React.MouseEvent, node: StoryRFNode) => {
      onSelect(node.id);
    },
    [onSelect]
  );

  const handlePaneClick = useCallback(() => {
    onSelect(null);
  }, [onSelect]);

  const displayNodes = useMemo(
    () => nodes.map((n) => ({ ...n, selected: n.id === selectedId })),
    [nodes, selectedId]
  );

  return (
    <ReactFlow
      nodes={displayNodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      onPaneClick={handlePaneClick}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      proOptions={{ hideAttribution: true }}
    >
      <Background gap={24} color="#1e293b" />
      <Controls />
      <MiniMap pannable zoomable style={{ background: '#0b1220' }} />
    </ReactFlow>
  );
}

import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { StoryRFNode } from './graph';

const KIND_COLORS: Record<string, { bg: string; border: string; label: string }> = {
  N: { bg: '#1e293b', border: '#475569', label: 'Narrative' },
  H: { bg: '#2b1d0c', border: '#b45309', label: 'Hub' },
  D: { bg: '#2a0e0e', border: '#b91c1c', label: 'Death' },
  C: { bg: '#0f2027', border: '#0ea5e9', label: 'Choice' },
};

export function StoryNode({ data, id, selected }: NodeProps<StoryRFNode>) {
  const palette = KIND_COLORS[data.kind] ?? KIND_COLORS.N!;
  return (
    <div
      style={{
        background: palette.bg,
        borderColor: selected ? '#facc15' : palette.border,
        borderWidth: selected ? 2 : 1,
        borderStyle: 'solid',
        borderRadius: 8,
        minWidth: 200,
        padding: '10px 12px',
        color: '#f8fafc',
        fontFamily: 'system-ui, sans-serif',
        boxShadow: selected ? '0 0 0 2px rgba(250,204,21,0.25)' : 'none',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#64748b' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            background: palette.border,
            color: '#0b1220',
            fontWeight: 700,
            fontSize: 11,
            padding: '2px 6px',
            borderRadius: 4,
          }}
        >
          {data.kind}
        </span>
        <span style={{ fontSize: 12, opacity: 0.75 }}>{id}</span>
      </div>
      <div style={{ marginTop: 6, fontSize: 13, fontWeight: 600, lineHeight: 1.25 }}>
        {data.label}
      </div>
      <div style={{ marginTop: 6, fontSize: 11, opacity: 0.7 }}>
        {data.interactionType}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#64748b' }} />
    </div>
  );
}

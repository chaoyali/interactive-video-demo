import type { Node, Story } from '@ivd/shared';
import { InteractionEditor } from './InteractionEditor';
import { Field, inputStyle, sectionStyle, sectionTitleStyle } from './fields';

type Props = {
  story: Story;
  selectedId: string;
  onStoryChange: (story: Story) => void;
  onClose: () => void;
};

const KIND_OPTIONS: { value: Node['kind']; label: string }[] = [
  { value: 'N', label: 'N — Narrative' },
  { value: 'H', label: 'H — Hub' },
  { value: 'C', label: 'C — Choice' },
  { value: 'D', label: 'D — Death / Ending' },
];

const closeButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid #334155',
  color: '#cbd5e1',
  borderRadius: 4,
  width: 26,
  height: 26,
  fontSize: 16,
  lineHeight: 1,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export function Inspector({ story, selectedId, onStoryChange, onClose }: Props) {
  const node = story.nodes[selectedId];
  if (!node) {
    return (
      <div
        style={{
          padding: 16,
          color: '#fecaca',
          fontSize: 13,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 8,
        }}
      >
        <span>Node "{selectedId}" not found.</span>
        <button style={closeButtonStyle} onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
    );
  }

  const updateNode = (patch: Partial<Node>) => {
    onStoryChange({
      ...story,
      nodes: { ...story.nodes, [node.id]: { ...node, ...patch } },
    });
  };

  return (
    <div style={{ padding: 16, overflowY: 'auto', height: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 12,
          gap: 8,
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Node</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc' }}>
            {node.id}
          </div>
        </div>
        <button style={closeButtonStyle} onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      <Field label="Label">
        <input
          style={inputStyle}
          value={node.label}
          onChange={(e) => updateNode({ label: e.target.value })}
        />
      </Field>
      <Field label="Kind">
        <select
          style={inputStyle}
          value={node.kind}
          onChange={(e) => updateNode({ kind: e.target.value as Node['kind'] })}
        >
          {KIND_OPTIONS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
      </Field>

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Video</div>
        <Field label="Source path">
          <input
            style={inputStyle}
            value={node.video.src}
            onChange={(e) => updateNode({ video: { ...node.video, src: e.target.value } })}
          />
        </Field>
        <Field label="Source aspect">
          <input
            type="number"
            step={0.01}
            min={0.01}
            style={inputStyle}
            value={node.video.sourceAspect}
            onChange={(e) =>
              updateNode({
                video: { ...node.video, sourceAspect: Number(e.target.value) || 1 },
              })
            }
          />
        </Field>
        <Field label="Loop">
          <input
            type="checkbox"
            checked={!!node.video.loop}
            onChange={(e) =>
              updateNode({ video: { ...node.video, loop: e.target.checked || undefined } })
            }
          />
        </Field>
      </div>

      <InteractionEditor
        story={story}
        interaction={node.interaction}
        onChange={(interaction) => updateNode({ interaction })}
      />
    </div>
  );
}

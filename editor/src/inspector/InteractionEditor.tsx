import type { Choice, Condition, Interaction, Story } from '@ivd/shared';
import {
  Field,
  buttonStyle,
  dangerButtonStyle,
  inputStyle,
  sectionStyle,
  sectionTitleStyle,
} from './fields';

type Props = {
  story: Story;
  interaction: Interaction;
  onChange: (next: Interaction) => void;
};

const INTERACTION_TYPES: Interaction['type'][] = [
  'linear',
  'tilt-look',
  'choice',
  'hub',
  'tap-hotspot',
  'qte',
  'ending',
];

const DEFAULT_BY_TYPE: Record<Interaction['type'], (fallbackTarget: string) => Interaction> = {
  linear: (t) => ({ type: 'linear', next: t }),
  'tilt-look': (t) => ({ type: 'tilt-look', next: t, maxAngleDeg: 25, zoom: 1.3 }),
  choice: (t) => ({
    type: 'choice',
    choices: [{ id: 'choice-1', label: 'Option A', next: t }],
  }),
  hub: (t) => ({
    type: 'hub',
    choices: [{ id: 'choice-1', label: 'Option A', next: t }],
    advanceWhen: { op: 'all', conditions: [] },
    advanceTo: t,
  }),
  'tap-hotspot': (t) => ({
    type: 'tap-hotspot',
    hotspots: [{ id: 'hotspot-1', rect: { x: 0, y: 0, w: 0.3, h: 0.3 }, next: t }],
  }),
  qte: (t) => ({ type: 'qte', window: { startMs: 0, endMs: 1000 }, onSuccess: t, onFail: t }),
  ending: () => ({ type: 'ending', outcome: 'death' }),
};

export function InteractionEditor({ story, interaction, onChange }: Props) {
  const nodeIds = Object.keys(story.nodes);
  const fallbackTarget = nodeIds[0] ?? '';

  const handleTypeChange = (type: Interaction['type']) => {
    if (type === interaction.type) return;
    onChange(DEFAULT_BY_TYPE[type](fallbackTarget));
  };

  return (
    <div style={sectionStyle}>
      <div style={sectionTitleStyle}>Interaction</div>
      <Field label="Type">
        <select
          style={inputStyle}
          value={interaction.type}
          onChange={(e) => handleTypeChange(e.target.value as Interaction['type'])}
        >
          {INTERACTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </Field>
      {renderBody(interaction, onChange, nodeIds)}
    </div>
  );
}

function renderBody(
  interaction: Interaction,
  onChange: (next: Interaction) => void,
  nodeIds: string[]
) {
  switch (interaction.type) {
    case 'linear':
      return (
        <Field label="Next">
          <NodeSelect
            value={interaction.next}
            nodeIds={nodeIds}
            onChange={(next) => onChange({ ...interaction, next })}
          />
        </Field>
      );
    case 'tilt-look':
      return (
        <>
          <Field label="Next">
            <NodeSelect
              value={interaction.next}
              nodeIds={nodeIds}
              onChange={(next) => onChange({ ...interaction, next })}
            />
          </Field>
          <Field label="Max angle (deg)">
            <input
              type="number"
              min={1}
              step={1}
              style={inputStyle}
              value={interaction.maxAngleDeg}
              onChange={(e) =>
                onChange({ ...interaction, maxAngleDeg: Number(e.target.value) || 1 })
              }
            />
          </Field>
          <Field label="Zoom">
            <input
              type="number"
              min={1}
              step={0.1}
              style={inputStyle}
              value={interaction.zoom}
              onChange={(e) =>
                onChange({ ...interaction, zoom: Number(e.target.value) || 1 })
              }
            />
          </Field>
        </>
      );
    case 'choice':
      return (
        <ChoiceListEditor
          choices={interaction.choices}
          nodeIds={nodeIds}
          onChange={(choices) => onChange({ ...interaction, choices })}
        />
      );
    case 'hub':
      return (
        <>
          <ChoiceListEditor
            choices={interaction.choices}
            nodeIds={nodeIds}
            onChange={(choices) => onChange({ ...interaction, choices })}
          />
          <Field label="Advance to">
            <NodeSelect
              value={interaction.advanceTo}
              nodeIds={nodeIds}
              onChange={(advanceTo) => onChange({ ...interaction, advanceTo })}
            />
          </Field>
          <Field label="Advance when (JSON)">
            <JsonTextarea
              value={interaction.advanceWhen}
              onChange={(v) =>
                onChange({ ...interaction, advanceWhen: v as Condition })
              }
            />
          </Field>
        </>
      );
    case 'ending':
      return (
        <Field label="Outcome">
          <input
            type="text"
            style={inputStyle}
            value={interaction.outcome}
            onChange={(e) => onChange({ ...interaction, outcome: e.target.value })}
          />
        </Field>
      );
    case 'tap-hotspot':
    case 'qte':
      return (
        <Field label="Raw JSON">
          <JsonTextarea
            value={interaction}
            onChange={(v) => onChange(v as Interaction)}
          />
        </Field>
      );
  }
}

function NodeSelect({
  value,
  nodeIds,
  onChange,
}: {
  value: string;
  nodeIds: string[];
  onChange: (v: string) => void;
}) {
  const options = nodeIds.includes(value) ? nodeIds : [value, ...nodeIds];
  return (
    <select style={inputStyle} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((id) => (
        <option key={id} value={id}>
          {id}
        </option>
      ))}
    </select>
  );
}

function ChoiceListEditor({
  choices,
  nodeIds,
  onChange,
}: {
  choices: Choice[];
  nodeIds: string[];
  onChange: (next: Choice[]) => void;
}) {
  const update = (i: number, patch: Partial<Choice>) => {
    onChange(choices.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  };
  const remove = (i: number) => onChange(choices.filter((_, idx) => idx !== i));
  const add = () => {
    const nextId = `choice-${choices.length + 1}`;
    onChange([
      ...choices,
      { id: nextId, label: 'New choice', next: nodeIds[0] ?? '' },
    ]);
  };

  return (
    <div>
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>Choices</div>
      {choices.map((c, i) => (
        <div
          key={i}
          style={{
            border: '1px solid #1e293b',
            borderRadius: 4,
            padding: 8,
            marginBottom: 8,
          }}
        >
          <Field label="ID">
            <input
              style={inputStyle}
              value={c.id}
              onChange={(e) => update(i, { id: e.target.value })}
            />
          </Field>
          <Field label="Label">
            <input
              style={inputStyle}
              value={c.label}
              onChange={(e) => update(i, { label: e.target.value })}
            />
          </Field>
          <Field label="Next">
            <NodeSelect
              value={c.next}
              nodeIds={nodeIds}
              onChange={(next) => update(i, { next })}
            />
          </Field>
          <button style={dangerButtonStyle} onClick={() => remove(i)}>
            Remove
          </button>
        </div>
      ))}
      <button style={buttonStyle} onClick={add}>
        + Add choice
      </button>
    </div>
  );
}

function JsonTextarea({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  return (
    <textarea
      style={{ ...inputStyle, fontFamily: 'ui-monospace, monospace', minHeight: 120 }}
      defaultValue={JSON.stringify(value, null, 2)}
      onBlur={(e) => {
        try {
          onChange(JSON.parse(e.target.value));
        } catch {
          /* keep prior value on parse error */
        }
      }}
    />
  );
}

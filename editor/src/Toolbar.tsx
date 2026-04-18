import { useRef } from 'react';
import type { Story } from '@ivd/shared';
import { downloadStory, loadStoryFromFile } from './io';

type Props = {
  story: Story;
  validationErrors: string[];
  onLoad: (story: Story) => void;
  onLoadError: (errors: string[]) => void;
};

const buttonStyle: React.CSSProperties = {
  background: '#1e293b',
  border: '1px solid #334155',
  color: '#e2e8f0',
  borderRadius: 4,
  padding: '6px 12px',
  fontSize: 13,
  cursor: 'pointer',
};

export function Toolbar({ story, validationErrors, onLoad, onLoadError }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const hasErrors = validationErrors.length > 0;

  const handleLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const result = await loadStoryFromFile(file);
    if (result.ok) onLoad(result.story);
    else onLoadError(result.errors);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 16px',
        background: '#0b1220',
        borderBottom: '1px solid #1e293b',
        color: '#e2e8f0',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ fontWeight: 600 }}>{story.title}</div>
      <div style={{ fontSize: 12, color: '#94a3b8' }}>v{story.version}</div>
      <div style={{ flex: 1 }} />
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        style={{ display: 'none' }}
        onChange={handleLoad}
      />
      <button style={buttonStyle} onClick={() => fileRef.current?.click()}>
        Load JSON
      </button>
      <button style={buttonStyle} onClick={() => downloadStory(story)}>
        Download JSON
      </button>
      <div
        style={{
          fontSize: 12,
          color: hasErrors ? '#fca5a5' : '#4ade80',
          fontWeight: 500,
        }}
      >
        {hasErrors ? `${validationErrors.length} error(s)` : 'valid'}
      </div>
    </div>
  );
}

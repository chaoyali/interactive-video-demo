import { useMemo, useState } from 'react';
import type { Story } from '@ivd/shared';
import { StorySchema } from '@ivd/shared';
import demoStory from '../../stories/perfect-neighbor-demo/story.json';
import { StoryCanvas } from './canvas/StoryCanvas';
import { Inspector } from './inspector/Inspector';
import { Toolbar } from './Toolbar';
import { ValidationPanel } from './ValidationPanel';

const bootstrap = StorySchema.parse(demoStory);

export function App() {
  const [story, setStory] = useState<Story>(bootstrap);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadErrors, setLoadErrors] = useState<string[]>([]);

  const validationErrors = useMemo(() => {
    const result = StorySchema.safeParse(story);
    if (result.success) return [];
    return result.error.errors.map(
      (e) => `${e.path.join('.') || '<root>'}: ${e.message}`
    );
  }, [story]);

  const handleLoad = (loaded: Story) => {
    setStory(loaded);
    setSelectedId(null);
    setLoadErrors([]);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#020617',
        color: '#e2e8f0',
      }}
    >
      <Toolbar
        story={story}
        validationErrors={validationErrors}
        onLoad={handleLoad}
        onLoadError={setLoadErrors}
      />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <StoryCanvas
            story={story}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onStoryChange={setStory}
          />
        </div>
        {selectedId && (
          <div
            style={{
              width: 340,
              borderLeft: '1px solid #1e293b',
              background: '#0b1220',
              overflow: 'hidden',
            }}
          >
            <Inspector
              story={story}
              selectedId={selectedId}
              onStoryChange={setStory}
              onClose={() => setSelectedId(null)}
            />
          </div>
        )}
      </div>
      <ValidationPanel errors={[...loadErrors, ...validationErrors]} />
    </div>
  );
}

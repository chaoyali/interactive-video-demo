import { validateStory, type Story } from '@ivd/shared';

export function downloadStory(story: Story) {
  const json = JSON.stringify(story, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${story.id || 'story'}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function loadStoryFromFile(file: File): Promise<
  { ok: true; story: Story } | { ok: false; errors: string[] }
> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    return validateStory(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown parse error';
    return { ok: false, errors: [msg] };
  }
}

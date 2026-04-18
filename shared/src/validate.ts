import { StorySchema } from './schema';
import type { Story } from './types';

export type ValidationResult =
  | { ok: true; story: Story }
  | { ok: false; errors: string[] };

export function validateStory(data: unknown): ValidationResult {
  const parsed = StorySchema.safeParse(data);
  if (parsed.success) return { ok: true, story: parsed.data };
  const errors = parsed.error.errors.map(
    (e) => `${e.path.join('.') || '<root>'}: ${e.message}`
  );
  return { ok: false, errors };
}

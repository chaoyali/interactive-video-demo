import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateStory } from '../validate';

const storyPath = process.argv[2] ?? 'stories/perfect-neighbor-demo/story.json';
const abs = resolve(process.cwd(), storyPath);

let raw: string;
try {
  raw = readFileSync(abs, 'utf8');
} catch (err) {
  console.error(`Could not read ${abs}: ${(err as Error).message}`);
  process.exit(2);
}

let data: unknown;
try {
  data = JSON.parse(raw);
} catch (err) {
  console.error(`Invalid JSON in ${abs}: ${(err as Error).message}`);
  process.exit(2);
}

const result = validateStory(data);
if (result.ok) {
  const nodeCount = Object.keys(result.story.nodes).length;
  console.log(`OK — "${result.story.title}" (${nodeCount} nodes)`);
  process.exit(0);
}

console.error(`FAILED — ${storyPath}`);
for (const msg of result.errors) console.error(`  • ${msg}`);
process.exit(1);

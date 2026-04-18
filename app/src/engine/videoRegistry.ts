// Maps story.json video `src` strings to bundled asset modules.
// Metro requires static literal require() paths, so we maintain an explicit map.
// Adding a new video means (a) dropping it in videos/ and (b) one line here.

export const videoRegistry: Record<string, number> = {
  'videos/room.mp4': require('../../../videos/room.mp4'),
};

export function resolveVideo(src: string): number {
  const asset = videoRegistry[src];
  if (asset === undefined) {
    throw new Error(
      `videoRegistry: no asset registered for "${src}". ` +
        `Add it in app/src/engine/videoRegistry.ts.`
    );
  }
  return asset;
}

export type ViewportSize = { width: number; height: number };
export type GlyphSize = { width: number; height: number };
export type CountdownPoint = { x: number; y: number };

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function createCountdownPositions(
  seed: number,
  count: number,
  viewport: ViewportSize,
  glyph: GlyphSize,
  margin = 36,
  minimumDistance = 90,
): CountdownPoint[] {
  const random = mulberry32(seed);
  const minX = margin + glyph.width / 2;
  const maxX = Math.max(minX, viewport.width - margin - glyph.width / 2);
  const minY = margin + glyph.height / 2;
  const maxY = Math.max(minY, viewport.height - margin - glyph.height / 2);
  const points: CountdownPoint[] = [];

  for (let index = 0; index < count; index += 1) {
    let accepted: CountdownPoint | undefined;
    let fallback: CountdownPoint = { x: minX, y: minY };

    for (let attempt = 0; attempt < 48; attempt += 1) {
      const candidate = {
        x: minX + random() * (maxX - minX),
        y: minY + random() * (maxY - minY),
      };
      fallback = candidate;
      const previous = points.at(-1);
      if (!previous || Math.hypot(candidate.x - previous.x, candidate.y - previous.y) >= minimumDistance) {
        accepted = candidate;
        break;
      }
    }

    points.push(accepted ?? fallback);
  }

  return points;
}

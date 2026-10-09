export type DriftDirection = 'up' | 'down';

/** Stable editorial shuffle: every column contains the full collection. */
export function buildDriftColumns<T>(items: readonly T[], count: number): T[][] {
  if (!items.length) return [];
  return Array.from({ length: Math.max(1, Math.round(count)) }, (_, column) => {
    if (items.length === 1) return [items[0]];
    let seed = (column + 1) * 7919;
    const result: T[] = [];
    for (let pass = 0; pass < 2; pass += 1) {
      const sequence = [...items];
      for (let i = sequence.length - 1; i > 0; i -= 1) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const j = seed % (i + 1);
        [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
      }
      // Prevent adjacent duplicates at the join and the seamless loop boundary.
      for (let i = 0; i < sequence.length; i += 1) {
        if (sequence[0] !== result.at(-1)
          && (pass === 0 || sequence.at(-1) !== result[0])) break;
        sequence.push(sequence.shift()!);
      }
      result.push(...sequence);
    }
    return result;
  });
}

export function columnFactor(index: number, variance: number): number {
  const pseudo = ((index * 0.6180339887 + 0.35) % 1) * 2 - 1;
  return 1 + variance * pseudo;
}

export function getBaseVelocity(
  index: number,
  speed: number,
  variance: number,
  direction: DriftDirection,
): number {
  const directionSign = direction === 'up' ? 1 : -1;
  const alternatingSign = index % 2 === 0 ? 1 : -1;
  return speed * columnFactor(index, variance) * directionSign * alternatingSign;
}

export function getVelocityTarget(
  baseVelocity: number,
  columnIndex: number,
  hoveredColumn: number,
): number {
  return hoveredColumn === columnIndex ? 0 : baseVelocity;
}

export function getVelocityEase(dt: number, targetVelocity: number): number {
  const timeConstant = targetVelocity === 0 ? 0.16 : 0.28;
  return 1 - Math.exp(-dt / timeConstant);
}

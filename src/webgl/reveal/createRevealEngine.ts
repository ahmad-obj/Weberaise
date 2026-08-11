import { RevealEngine } from './RevealEngine';
import { chooseRevealQuality, type RevealQualityInput } from './quality';

export function createRevealEngine(canvas: HTMLCanvasElement, input: Omit<RevealQualityInput, 'webgl2'>): RevealEngine | null {
  const probe = document.createElement('canvas');
  const webgl2 = Boolean(probe.getContext('webgl2'));
  const quality = chooseRevealQuality({ ...input, webgl2 });
  if (quality.mode === 'fallback') return null;
  try {
    return new RevealEngine(canvas, quality);
  } catch {
    return null;
  }
}

export async function warmRevealEngine(): Promise<void> {
  if (typeof document === 'undefined') return;
  const canvas = document.createElement('canvas');
  const engine = createRevealEngine(canvas, {
    width: 32,
    height: 32,
    dpr: 1,
    reducedMotion: false,
    deviceMemory: (navigator as Navigator & { deviceMemory?: number }).deviceMemory,
  });
  if (!engine) return;
  engine.resize(32, 32, 1);
  engine.dispose();
}

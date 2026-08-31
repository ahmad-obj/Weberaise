import { RevealEngine } from './RevealEngine';
import { chooseRevealQuality, type RevealQualityInput } from './quality';

export function createRevealEngine(
  canvas: HTMLCanvasElement,
  input: Omit<RevealQualityInput, 'webgl2'>,
): RevealEngine | null {
  const probe = document.createElement('canvas');
  const webgl2 = Boolean(probe.getContext('webgl2'));
  const quality = chooseRevealQuality({ ...input, webgl2 });
  if (quality.mode === 'fallback') return null;

  try {
    // RevealEngine itself is the final capability authority: it validates the
    // half-float color-buffer extension and actual RGBA16F framebuffer creation.
    return new RevealEngine(canvas, quality);
  } catch {
    return null;
  }
}

export async function warmRevealEngine(): Promise<void> {
  if (typeof document === 'undefined') return;
  const canvas = document.createElement('canvas');
  const engine = createRevealEngine(canvas, {
    width: 64,
    height: 64,
    dpr: 1,
    reducedMotion: false,
    deviceMemory: 8,
  });
  if (!engine) return;

  try {
    engine.resize(64, 64, 1);
    engine.prime();
  } finally {
    engine.dispose();
  }
}

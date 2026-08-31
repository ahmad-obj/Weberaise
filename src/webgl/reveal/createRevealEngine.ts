import { RevealEngine } from './RevealEngine';
import { chooseRevealQuality, type RevealQualityInput } from './quality';

export function createRevealEngine(
  canvas: HTMLCanvasElement,
  input: Omit<RevealQualityInput, 'webgl2'>,
): RevealEngine | null {
  if (typeof WebGL2RenderingContext === 'undefined') return null;

  // Do not create a second throwaway WebGL context just to probe support.
  // RevealEngine is the capability authority on the real hero canvas: context
  // acquisition, EXT_color_buffer_float and RGBA16F completeness may all fail
  // there and are deliberately caught into the CSS fallback.
  const quality = chooseRevealQuality({ ...input, webgl2: true });

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

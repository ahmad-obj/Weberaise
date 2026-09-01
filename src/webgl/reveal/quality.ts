export type RevealQualityMode = 'full' | 'lite' | 'reduced' | 'fallback';

export type RevealQualityInput = {
  width: number;
  height: number;
  dpr: number;
  reducedMotion: boolean;
  webgl2: boolean;
  deviceMemory?: number;
};

export type RevealQuality = {
  mode: RevealQualityMode;
  simResolution: number;
  dyeResolution: number;
  pressureIterations: number;
  dprCap: number;
  velocityRetention60: number;
  dyeRetention60: number;
  splatRadius: number;
  splatForce: number;
  revealGain: number;
  edgeSoftness: number;
  edgeWidth: number;
  enableVelocity: boolean;
};

const FULL: RevealQuality = {
  mode: 'full',
  simResolution: 256,
  dyeResolution: 512,
  pressureIterations: 20,
  dprCap: 2,
  velocityRetention60: 0.962,
  dyeRetention60: 0.988,
  splatRadius: 0.00024,
  splatForce: 11800,
  revealGain: 3.9,
  edgeSoftness: 0.5,
  edgeWidth: 0.01,
  enableVelocity: true,
};

const LITE: RevealQuality = {
  mode: 'lite',
  simResolution: 128,
  dyeResolution: 256,
  pressureIterations: 10,
  dprCap: 1.25,
  velocityRetention60: 0.962,
  dyeRetention60: 0.988,
  splatRadius: 0.00024,
  splatForce: 11800,
  revealGain: 3.9,
  edgeSoftness: 0.5,
  edgeWidth: 0.01,
  enableVelocity: true,
};

const REDUCED: RevealQuality = {
  mode: 'reduced',
  simResolution: 96,
  dyeResolution: 192,
  pressureIterations: 0,
  dprCap: 1,
  velocityRetention60: 0,
  dyeRetention60: 0.985,
  splatRadius: 0.00032,
  splatForce: 0,
  revealGain: 3.9,
  edgeSoftness: 0.5,
  edgeWidth: 0.01,
  enableVelocity: false,
};

const FALLBACK: RevealQuality = {
  mode: 'fallback',
  simResolution: 0,
  dyeResolution: 0,
  pressureIterations: 0,
  dprCap: 1,
  velocityRetention60: 0,
  dyeRetention60: 0,
  splatRadius: 0,
  splatForce: 0,
  revealGain: 3.9,
  edgeSoftness: 0.5,
  edgeWidth: 0.01,
  enableVelocity: false,
};

export function chooseRevealQuality(input: RevealQualityInput): RevealQuality {
  if (!input.webgl2) return { ...FALLBACK };
  if (input.reducedMotion) return { ...REDUCED };

  const shortAxis = Math.min(input.width, input.height);
  const lowMemory = (input.deviceMemory ?? 4) <= 2;
  if (lowMemory || shortAxis < 560) return { ...LITE };
  return { ...FULL };
}

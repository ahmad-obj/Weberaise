export type RevealQualityMode = 'full' | 'lite' | 'fallback';

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
  maskShortAxis: number;
  dprCap: number;
  halfLife: number;
  advection: number;
  noiseAmount: number;
};

export function chooseRevealQuality(input: RevealQualityInput): RevealQuality {
  if (!input.webgl2) {
    return { mode: 'fallback', maskShortAxis: 0, dprCap: 1, halfLife: 1.45, advection: 0, noiseAmount: 0 };
  }

  const shortAxis = Math.min(input.width, input.height);
  const lowMemory = (input.deviceMemory ?? 4) <= 2;
  const lite = input.reducedMotion || lowMemory || shortAxis < 560;

  if (lite) {
    return {
      mode: 'lite',
      maskShortAxis: Math.min(240, Math.max(176, Math.round(shortAxis * 0.44))),
      dprCap: 1.2,
      halfLife: 1.4,
      advection: input.reducedMotion ? 0 : 0.007,
      noiseAmount: input.reducedMotion ? 0 : 0.012,
    };
  }

  return {
    mode: 'full',
    maskShortAxis: Math.min(384, Math.max(288, Math.round(shortAxis * 0.42))),
    dprCap: 1.5,
    halfLife: 1.45,
    advection: 0.012,
    noiseAmount: 0.018,
  };
}

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
    return { mode: 'fallback', maskShortAxis: 0, dprCap: 1, halfLife: 2.5, advection: 0, noiseAmount: 0 };
  }

  const shortAxis = Math.min(input.width, input.height);
  const lowMemory = (input.deviceMemory ?? 4) <= 2;
  const lite = input.reducedMotion || lowMemory || shortAxis < 560;

  if (lite) {
    return {
      mode: 'lite',
      maskShortAxis: Math.min(300, Math.max(208, Math.round(shortAxis * 0.48))),
      dprCap: 1.2,
      halfLife: 2.5,
      advection: input.reducedMotion ? 0 : 0.0015,
      noiseAmount: input.reducedMotion ? 0 : 0.003,
    };
  }

  return {
    mode: 'full',
    maskShortAxis: Math.min(512, Math.max(336, Math.round(shortAxis * 0.52))),
    dprCap: 1.5,
    halfLife: 2.75,
    advection: 0.003,
    noiseAmount: 0.006,
  };
}

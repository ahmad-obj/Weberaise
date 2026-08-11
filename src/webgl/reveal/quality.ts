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
  lifetime: number;
  holdFraction: number;
  maxPrimitives: number;
  surfaceThreshold: number;
  contourWarp: number;
};

export function chooseRevealQuality(input: RevealQualityInput): RevealQuality {
  if (!input.webgl2) {
    return {
      mode: 'fallback',
      maskShortAxis: 0,
      dprCap: 1,
      lifetime: 2.8,
      holdFraction: 0.58,
      maxPrimitives: 0,
      surfaceThreshold: 0.42,
      contourWarp: 0,
    };
  }

  const shortAxis = Math.min(input.width, input.height);
  const lowMemory = (input.deviceMemory ?? 4) <= 2;
  const lite = input.reducedMotion || lowMemory || shortAxis < 560;

  if (lite) {
    return {
      mode: 'lite',
      maskShortAxis: Math.min(320, Math.max(216, Math.round(shortAxis * 0.50))),
      dprCap: 1.2,
      lifetime: input.reducedMotion ? 2.5 : 3.15,
      holdFraction: 0.58,
      maxPrimitives: 240,
      surfaceThreshold: 0.42,
      contourWarp: input.reducedMotion ? 0 : 0.0045,
    };
  }

  return {
    mode: 'full',
    maskShortAxis: Math.min(512, Math.max(352, Math.round(shortAxis * 0.54))),
    dprCap: 1.5,
    lifetime: 3.6,
    holdFraction: 0.60,
    maxPrimitives: 420,
    surfaceThreshold: 0.40,
    contourWarp: 0.010,
  };
}

export type ParticleProfile = {
  maxParticles: number;
  dprCap: number;
  scatterMin: number;
  scatterMax: number;
  gatherDuration: number;
};

export function deterministicUnit(index: number, salt = 0): number {
  const value = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

export function particleProfileForWidth(width: number): ParticleProfile {
  return width < 720
    ? {
        maxParticles: 1500,
        dprCap: 1.35,
        scatterMin: 45,
        scatterMax: 75,
        gatherDuration: 1150,
      }
    : {
        maxParticles: 2700,
        dprCap: 1.5,
        scatterMin: 70,
        scatterMax: 110,
        gatherDuration: 1300,
      };
}

export function easeOutCubic(progress: number): number {
  const clamped = Math.min(1, Math.max(0, progress));
  return 1 - Math.pow(1 - clamped, 3);
}

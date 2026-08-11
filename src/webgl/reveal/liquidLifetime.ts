const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export function isLiquidPrimitiveAlive(ageSeconds: number, lifetimeSeconds: number): boolean {
  const lifetime = Math.max(0.05, lifetimeSeconds);
  return ageSeconds < lifetime;
}

export function liquidRadiusScale(
  ageSeconds: number,
  lifetimeSeconds: number,
  holdFraction = 0.62,
): number {
  const lifetime = Math.max(0.05, lifetimeSeconds);
  const age = Math.max(0, ageSeconds);
  if (age >= lifetime) return 0;

  const hold = clamp01(holdFraction);
  const holdEnd = lifetime * hold;
  if (age <= holdEnd || hold >= 0.999) return 1;

  const contraction = clamp01((age - holdEnd) / Math.max(0.0001, lifetime - holdEnd));
  const eased = contraction * contraction * (3 - 2 * contraction);
  return Math.pow(Math.max(0, 1 - eased), 0.72);
}

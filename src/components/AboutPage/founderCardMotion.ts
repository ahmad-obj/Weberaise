export type FounderRotation = Readonly<{ rotateX: number; rotateY: number }>;

export const FOUNDER_TILT = Object.freeze({
  maxRotateX: 12,
  maxRotateY: 12,
});

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function getFounderCardRotation(
  pointerX: number,
  pointerY: number,
  width: number,
  height: number,
): FounderRotation {
  if (width <= 0 || height <= 0) return { rotateX: 0, rotateY: 0 };

  const x = clamp((pointerX - width / 2) / (width / 2), -1, 1);
  const y = clamp((pointerY - height / 2) / (height / 2), -1, 1);

  return {
    rotateX: Number((-y * FOUNDER_TILT.maxRotateX).toFixed(4)),
    rotateY: Number((x * FOUNDER_TILT.maxRotateY).toFixed(4)),
  };
}

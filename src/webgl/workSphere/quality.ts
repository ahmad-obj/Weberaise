import type { WorkQualityName, WorkQualityProfile } from './types';

export const WORK_QUALITY_PROFILES: Record<WorkQualityName, WorkQualityProfile> = {
  full: { dprCap: 1.5, liveVideoSlots: 3, deformation: 1, inertia: 1 },
  lite: { dprCap: 1.2, liveVideoSlots: 2, deformation: 0.45, inertia: 0.8 },
  mobile: { dprCap: 1.15, liveVideoSlots: 1, deformation: 0.2, inertia: 0.62 },
  reduced: { dprCap: 1, liveVideoSlots: 1, deformation: 0, inertia: 0 },
};

export function chooseWorkQuality(options?: {
  reducedMotion?: boolean;
  width?: number;
  coarsePointer?: boolean;
  hardwareConcurrency?: number;
  devicePixelRatio?: number;
}): WorkQualityName {
  if (options?.reducedMotion) return 'reduced';
  if (options?.coarsePointer && (options.width ?? 1024) < 820) return 'mobile';
  if ((options?.hardwareConcurrency ?? 8) <= 4 || (options?.devicePixelRatio ?? 1) >= 2.75) {
    return 'lite';
  }
  return 'full';
}

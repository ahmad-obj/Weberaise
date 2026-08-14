import type { Quat } from './math';

export type Vec3 = [number, number, number];

export type SphereSlot = {
  id: number;
  direction: Vec3;
  projectIndex: number;
};

export type WorkQualityName = 'full' | 'lite' | 'mobile' | 'reduced';

export type WorkQualityProfile = {
  dprCap: number;
  liveVideoSlots: number;
  inertia: number;
};

export type WorkSphereTransitionSnapshot = {
  orientation: Quat;
  activeSlotId: number;
};

export type WorkResolveStatus = {
  slotId: number;
  alignmentError: number;
  rotationVelocity: number;
  ready: boolean;
};

export type WorkSphereCallbacks = {
  onReady?: () => void;
  onActiveSlotChange?: (slotId: number) => void;
  onMovementChange?: (moving: boolean) => void;
  onProjectActivate?: (slotId: number) => void;
  onCapabilityFailure?: (reason: Error) => void;
};

export type WorkSphereOptions = {
  reducedMotion?: boolean;
  quality?: WorkQualityName;
};

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
  deformation: number;
  inertia: number;
};

export type WorkSphereCallbacks = {
  onReady?: () => void;
  onActiveSlotChange?: (slotId: number) => void;
  onMovementChange?: (moving: boolean) => void;
  onCapabilityFailure?: (reason: Error) => void;
};

export type WorkSphereOptions = {
  reducedMotion?: boolean;
  quality?: WorkQualityName;
};

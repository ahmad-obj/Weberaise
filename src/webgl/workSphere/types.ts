import type { WorkProject } from '@/content/workProjects';
import type { Quat } from './math';

export type Vec3 = [number, number, number];

export type SphereSlot = {
  id: number;
  direction: Vec3;
  projectIndex: number;
};

export type ScreenBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type WorkQualityName = 'full' | 'lite' | 'mobile' | 'reduced';

export type WorkQualityProfile = {
  dprCap: number;
  liveVideoSlots: number;
  deformation: number;
  inertia: number;
};

export type WorkSphereSnapshot = {
  orientation: Quat;
  activeSlotId: number;
};

export type WorkSphereCallbacks = {
  onReady?: () => void;
  onActiveSlotChange?: (slotId: number) => void;
  onHoverSlotChange?: (slotId: number | null) => void;
  onMovementChange?: (moving: boolean) => void;
  onProjectActivate?: (slotId: number) => void;
  onCapabilityFailure?: (reason: Error) => void;
};

export type WorkSphereOptions = {
  reducedMotion?: boolean;
  quality?: WorkQualityName;
};

export type WorkSphereProjectSet = readonly WorkProject[];

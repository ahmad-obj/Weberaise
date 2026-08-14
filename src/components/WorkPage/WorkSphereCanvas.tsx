'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import type { WorkProject } from '@/content/workProjects';
import { chooseWorkQuality } from '@/webgl/workSphere/quality';
import { WorkSphereEngine } from '@/webgl/workSphere/WorkSphereEngine';
import type { ScreenBounds, WorkSphereSnapshot } from '@/webgl/workSphere/types';

export type WorkSphereHandle = {
  start(): void;
  stop(): void;
  setInteractive(value: boolean): void;
  setEntranceProgress(progress: number): void;
  setProjectOpening(slotId: number, progress: number): void;
  setSelectedHidden(hidden: boolean): void;
  snapToSlot(slotId: number): void;
  getSlotScreenBounds(slotId: number): ScreenBounds | null;
  getOrientationSnapshot(): WorkSphereSnapshot | null;
  restoreOrientation(snapshot: WorkSphereSnapshot): void;
  getProjectIndexForSlot(slotId: number): number;
};

type WorkSphereCanvasProps = {
  projects: readonly WorkProject[];
  reducedMotion: boolean;
  interactive: boolean;
  className?: string;
  onReady(): void;
  onActiveSlotChange(slotId: number): void;
  onHoverSlotChange(slotId: number | null): void;
  onMovementChange(moving: boolean): void;
  onProjectActivate(slotId: number): void;
  onCapabilityFailure(error: Error): void;
};

export const WorkSphereCanvas = forwardRef<WorkSphereHandle, WorkSphereCanvasProps>(
  function WorkSphereCanvas(
    {
      projects,
      reducedMotion,
      interactive,
      className,
      onReady,
      onActiveSlotChange,
      onHoverSlotChange,
      onMovementChange,
      onProjectActivate,
      onCapabilityFailure,
    },
    ref,
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<WorkSphereEngine | null>(null);
    const projectKey = useMemo(() => projects.map(project => project.slug).join('|'), [projects]);
    const callbacksRef = useRef({
      onReady,
      onActiveSlotChange,
      onHoverSlotChange,
      onMovementChange,
      onProjectActivate,
      onCapabilityFailure,
    });

    callbacksRef.current = {
      onReady,
      onActiveSlotChange,
      onHoverSlotChange,
      onMovementChange,
      onProjectActivate,
      onCapabilityFailure,
    };

    useImperativeHandle(ref, () => ({
      start: () => engineRef.current?.start(),
      stop: () => engineRef.current?.stop(),
      setInteractive: value => engineRef.current?.setInteractive(value),
      setEntranceProgress: progress => engineRef.current?.setEntranceProgress(progress),
      setProjectOpening: (slotId, progress) => engineRef.current?.setProjectOpening(slotId, progress),
      setSelectedHidden: hidden => engineRef.current?.setSelectedHidden(hidden),
      snapToSlot: slotId => engineRef.current?.snapToSlot(slotId),
      getSlotScreenBounds: slotId => engineRef.current?.getSlotScreenBounds(slotId) ?? null,
      getOrientationSnapshot: () => engineRef.current?.getOrientationSnapshot() ?? null,
      restoreOrientation: snapshot => engineRef.current?.restoreOrientation(snapshot),
      getProjectIndexForSlot: slotId => engineRef.current?.getProjectIndexForSlot(slotId) ?? -1,
    }), []);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || !projects.length) return undefined;

      try {
        const quality = chooseWorkQuality({
          reducedMotion,
          width: window.innerWidth,
          coarsePointer: window.matchMedia('(pointer: coarse)').matches,
          hardwareConcurrency: navigator.hardwareConcurrency,
          devicePixelRatio: window.devicePixelRatio,
        });
        const engine = new WorkSphereEngine(
          canvas,
          projects,
          {
            onReady: () => callbacksRef.current.onReady(),
            onActiveSlotChange: slotId => callbacksRef.current.onActiveSlotChange(slotId),
            onHoverSlotChange: slotId => callbacksRef.current.onHoverSlotChange(slotId),
            onMovementChange: moving => callbacksRef.current.onMovementChange(moving),
            onProjectActivate: slotId => callbacksRef.current.onProjectActivate(slotId),
            onCapabilityFailure: error => callbacksRef.current.onCapabilityFailure(error),
          },
          { reducedMotion, quality },
        );
        engineRef.current = engine;
        callbacksRef.current.onActiveSlotChange(engine.getActiveSlotId());
        engine.setInteractive(interactive);
        engine.start();
      } catch (error) {
        callbacksRef.current.onCapabilityFailure(
          error instanceof Error ? error : new Error('Unable to initialize Work sphere.'),
        );
      }

      return () => {
        engineRef.current?.destroy();
        engineRef.current = null;
      };
    }, [interactive, projectKey, projects, reducedMotion]);

    useEffect(() => {
      engineRef.current?.setInteractive(interactive);
    }, [interactive]);

    return (
      <canvas
        ref={canvasRef}
        className={className}
        data-work-sphere-canvas
        aria-hidden="true"
      />
    );
  },
);

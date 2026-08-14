'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import type { WorkProject } from '@/content/workProjects';
import type { ScreenBounds } from '@/webgl/workSphere/activation';
import { chooseWorkQuality } from '@/webgl/workSphere/quality';
import type {
  WorkResolveStatus,
  WorkSphereTransitionSnapshot,
} from '@/webgl/workSphere/types';
import { WorkSphereEngine } from '@/webgl/workSphere/WorkSphereEngine';

export type WorkSphereHandle = {
  start(): void;
  stop(): void;
  setInteractive(value: boolean): void;
  setEntranceProgress(progress: number): void;
  snapToSlot(slotId: number): void;
  captureTransitionSnapshot(): WorkSphereTransitionSnapshot | null;
  beginResolveToSlot(slotId: number): void;
  getResolveStatus(): WorkResolveStatus | null;
  getSlotScreenBounds(slotId: number): ScreenBounds | null;
  setSelectedSlotHidden(slotId: number | null): void;
  setProjectOpenProgress(progress: number): void;
  restoreTransitionSnapshot(snapshot: WorkSphereTransitionSnapshot): void;
  getProjectIndexForSlot(slotId: number): number;
};

type WorkSphereCanvasProps = {
  projects: readonly WorkProject[];
  reducedMotion: boolean;
  interactive: boolean;
  className?: string;
  onReady(): void;
  onActiveSlotChange(slotId: number): void;
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
      onMovementChange,
      onProjectActivate,
      onCapabilityFailure,
    });

    callbacksRef.current = {
      onReady,
      onActiveSlotChange,
      onMovementChange,
      onProjectActivate,
      onCapabilityFailure,
    };

    useImperativeHandle(ref, () => ({
      start: () => engineRef.current?.start(),
      stop: () => engineRef.current?.stop(),
      setInteractive: value => engineRef.current?.setInteractive(value),
      setEntranceProgress: progress => engineRef.current?.setEntranceProgress(progress),
      snapToSlot: slotId => engineRef.current?.snapToSlot(slotId),
      captureTransitionSnapshot: () => engineRef.current?.captureTransitionSnapshot() ?? null,
      beginResolveToSlot: slotId => engineRef.current?.beginResolveToSlot(slotId),
      getResolveStatus: () => engineRef.current?.getResolveStatus() ?? null,
      getSlotScreenBounds: slotId => engineRef.current?.getSlotScreenBounds(slotId) ?? null,
      setSelectedSlotHidden: slotId => engineRef.current?.setSelectedSlotHidden(slotId),
      setProjectOpenProgress: progress => engineRef.current?.setProjectOpenProgress(progress),
      restoreTransitionSnapshot: snapshot => engineRef.current?.restoreTransitionSnapshot(snapshot),
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
            onMovementChange: moving => callbacksRef.current.onMovementChange(moving),
            onProjectActivate: slotId => callbacksRef.current.onProjectActivate(slotId),
            onCapabilityFailure: error => callbacksRef.current.onCapabilityFailure(error),
          },
          { reducedMotion, quality },
        );
        engineRef.current = engine;
        callbacksRef.current.onActiveSlotChange(engine.getActiveSlotId());
        engine.setInteractive(false);
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
      // The project key is the engine identity boundary; live callbacks are refs.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectKey, reducedMotion]);

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

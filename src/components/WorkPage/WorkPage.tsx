'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import gsap from 'gsap';
import type { WorkProject } from '@/content/workProjects';
import { buildProjectSlots } from '@/webgl/workSphere/geometry';
import { nextKeyboardSlot } from '@/webgl/workSphere/selection';
import type { ScreenBounds, WorkSphereSnapshot } from '@/webgl/workSphere/types';
import { ProjectShowcase } from './ProjectShowcase';
import { ProjectTransitionBridge } from './ProjectTransitionBridge';
import { WorkBrowseMeta } from './WorkBrowseMeta';
import { WorkFallback } from './WorkFallback';
import { WorkOpening } from './WorkOpening';
import { WorkSphereCanvas, type WorkSphereHandle } from './WorkSphereCanvas';
import { INITIAL_WORK_STATE, workReducer } from './workState';
import styles from './WorkPage.module.css';

type WorkPageProps = {
  projects: readonly WorkProject[];
};

function readReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function WorkPage({ projects }: WorkPageProps) {
  const [state, dispatch] = useReducer(workReducer, INITIAL_WORK_STATE);
  const [sphereReady, setSphereReady] = useState(false);
  const [capabilityFailed, setCapabilityFailed] = useState(false);
  const [activeSlotId, setActiveSlotId] = useState(0);
  const [hoverSlotId, setHoverSlotId] = useState<number | null>(null);
  const [moving, setMoving] = useState(false);
  const [bridgeBounds, setBridgeBounds] = useState<ScreenBounds | null>(null);
  const reducedMotion = useMemo(readReducedMotion, []);
  const slots = useMemo(() => buildProjectSlots(projects.length), [projects.length]);
  const sphereRef = useRef<WorkSphereHandle>(null);
  const orientationRef = useRef<WorkSphereSnapshot | null>(null);
  const semanticRefs = useRef(new Map<number, HTMLButtonElement>());

  const selectedProject = state.selectedProjectSlug
    ? projects.find(project => project.slug === state.selectedProjectSlug) ?? null
    : null;

  const browseSlotId = hoverSlotId ?? activeSlotId;
  const browseSlot = slots.find(slot => slot.id === browseSlotId);
  const browseProject = browseSlot ? projects[browseSlot.projectIndex] ?? null : null;
  const fallbackActive = capabilityFailed && state.phase !== 'opening';

  useEffect(() => {
    const shouldLockScroll =
      state.phase !== 'projectShowcase'
      && state.phase !== 'empty'
      && !fallbackActive;
    document.documentElement.classList.toggle('work-page-scroll-locked', shouldLockScroll);
    return () => document.documentElement.classList.remove('work-page-scroll-locked');
  }, [fallbackActive, state.phase]);

  const handleOpeningComplete = useCallback(() => {
    if (!projects.length) dispatch({ type: 'EMPTY_PROJECTS' });
    else dispatch({ type: 'OPENING_READY' });
  }, [projects.length]);

  useEffect(() => {
    if (state.phase !== 'sphereEntering' || capabilityFailed) return undefined;
    const sphere = sphereRef.current;
    if (!sphere) return undefined;

    sphere.setInteractive(false);
    sphere.setEntranceProgress(0);
    const progress = { value: 0 };
    const tween = gsap.to(progress, {
      value: 1,
      duration: reducedMotion ? 0.28 : 0.9,
      ease: reducedMotion ? 'power1.out' : 'power3.out',
      onUpdate: () => sphere.setEntranceProgress(progress.value),
      onComplete: () => {
        sphere.setEntranceProgress(1);
        sphere.setInteractive(true);
        dispatch({ type: 'SPHERE_ENTERED' });
      },
    });
    return () => tween.kill();
  }, [capabilityFailed, reducedMotion, state.phase]);

  const activateSlot = useCallback((slotId: number) => {
    if (state.phase !== 'sphereInteractive') return;
    const slot = slots.find(candidate => candidate.id === slotId);
    const sphere = sphereRef.current;
    if (!slot || !sphere) return;
    const project = projects[slot.projectIndex];
    const sourceBounds = sphere.getSlotScreenBounds(slotId);
    const snapshot = sphere.getOrientationSnapshot();
    if (!project || !sourceBounds || !snapshot) return;

    orientationRef.current = snapshot;
    setBridgeBounds(sourceBounds);
    sphere.setInteractive(false);
    sphere.setProjectOpening(slotId, 0);
    dispatch({ type: 'OPEN_PROJECT', projectSlug: project.slug, slotId });
  }, [projects, slots, state.phase]);

  useEffect(() => {
    if (state.phase !== 'projectOpening' || state.selectedSlotId === null) return undefined;
    const sphere = sphereRef.current;
    if (!sphere) return undefined;
    const progress = { value: 0 };
    const tween = gsap.to(progress, {
      value: 1,
      duration: reducedMotion ? 0.18 : 0.56,
      ease: 'power3.inOut',
      onUpdate: () => sphere.setProjectOpening(state.selectedSlotId!, progress.value),
      onComplete: () => sphere.setProjectOpening(state.selectedSlotId!, 1),
    });
    return () => tween.kill();
  }, [reducedMotion, state.phase, state.selectedSlotId]);

  const handleOpenBridgeHandoff = useCallback(() => {
    sphereRef.current?.setSelectedHidden(true);
  }, []);

  const handleOpenBridgeComplete = useCallback(() => {
    sphereRef.current?.stop();
    dispatch({ type: 'PROJECT_OPENED' });
    setBridgeBounds(null);
  }, []);

  const beginReturn = useCallback(() => {
    if (
      state.phase !== 'projectShowcase'
      || state.selectedSlotId === null
      || !selectedProject
    ) return;

    const sphere = sphereRef.current;
    const snapshot = orientationRef.current;
    if (!sphere || !snapshot) return;

    window.scrollTo(0, 0);
    sphere.restoreOrientation(snapshot);
    sphere.setInteractive(false);
    sphere.setProjectOpening(state.selectedSlotId, 1);
    sphere.setSelectedHidden(true);
    sphere.start();
    const destination = sphere.getSlotScreenBounds(state.selectedSlotId);
    if (!destination) return;
    setBridgeBounds(destination);
    dispatch({ type: 'RETURN_TO_SPHERE' });
  }, [selectedProject, state.phase, state.selectedSlotId]);

  const handleCloseBridgeHandoff = useCallback(() => {
    sphereRef.current?.setSelectedHidden(false);
  }, []);

  const handleCloseBridgeComplete = useCallback(() => {
    if (state.selectedSlotId === null) return;
    const sphere = sphereRef.current;
    sphere?.setProjectOpening(state.selectedSlotId, 0);
    sphere?.setSelectedHidden(false);
    sphere?.setInteractive(true);
    setBridgeBounds(null);
    dispatch({ type: 'SPHERE_RESTORED' });

    const slot = slots.find(candidate => candidate.id === state.selectedSlotId);
    if (slot) semanticRefs.current.get(slot.projectIndex)?.focus({ preventScroll: true });
  }, [slots, state.selectedSlotId]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (state.phase === 'projectShowcase' && event.key === 'Escape') {
        event.preventDefault();
        beginReturn();
        return;
      }
      if (state.phase !== 'sphereInteractive') return;

      const target = event.target as HTMLElement | null;
      const interactiveTarget = target?.closest('a,button,video,input,textarea,select');
      const isSemanticTarget = Boolean(target?.closest('[data-work-semantic-project]'));

      if (event.key.startsWith('Arrow')) {
        event.preventDefault();
        const delta = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
        const next = nextKeyboardSlot(activeSlotId, delta, slots.length);
        if (next >= 0) {
          sphereRef.current?.snapToSlot(next);
          setActiveSlotId(next);
        }
        return;
      }

      if ((event.key === 'Enter' || event.key === ' ') && (!interactiveTarget || isSemanticTarget)) {
        if (!isSemanticTarget) {
          event.preventDefault();
          activateSlot(activeSlotId);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activateSlot, activeSlotId, beginReturn, slots.length, state.phase]);

  if (state.phase === 'empty') {
    return (
      <main className={styles.page}>
        <section className={styles.emptyState}>
          <h1>SELECTED WORK IS BEING PREPARED.</h1>
          <a href="/">Back to Weberaise</a>
        </section>
      </main>
    );
  }

  if (fallbackActive) {
    return (
      <main className={styles.page}>
        <WorkFallback projects={projects} />
      </main>
    );
  }

  return (
    <main className={styles.page} data-work-phase={state.phase}>
      {state.phase !== 'projectShowcase' && (
        <div className={styles.viewport}>
          <div
            className={styles.sphereLayer}
            data-hidden={state.phase === 'opening' ? 'true' : 'false'}
          >
            {!!projects.length && (
              <WorkSphereCanvas
                ref={sphereRef}
                projects={projects}
                reducedMotion={reducedMotion}
                interactive={state.phase === 'sphereInteractive'}
                className={styles.sphereCanvas}
                onReady={() => setSphereReady(true)}
                onActiveSlotChange={setActiveSlotId}
                onHoverSlotChange={setHoverSlotId}
                onMovementChange={setMoving}
                onProjectActivate={activateSlot}
                onCapabilityFailure={() => {
                  setCapabilityFailed(true);
                  setSphereReady(true);
                }}
              />
            )}
          </div>

          {state.phase === 'opening' && (
            <WorkOpening
              ready={!projects.length || sphereReady || capabilityFailed}
              reducedMotion={reducedMotion}
              onComplete={handleOpeningComplete}
            />
          )}

          <WorkBrowseMeta
            project={browseProject}
            moving={moving}
            visible={state.phase === 'sphereInteractive'}
          />

          {state.phase === 'sphereInteractive' && (
            <div className={styles.semanticList} aria-label="Work projects">
              {projects.map((project, projectIndex) => {
                const slot = slots.find(candidate => candidate.projectIndex === projectIndex);
                if (!slot) return null;
                return (
                  <button
                    key={project.slug}
                    ref={node => {
                      if (node) semanticRefs.current.set(projectIndex, node);
                      else semanticRefs.current.delete(projectIndex);
                    }}
                    type="button"
                    className={styles.semanticButton}
                    data-work-semantic-project
                    onFocus={() => sphereRef.current?.snapToSlot(slot.id)}
                    onClick={() => activateSlot(slot.id)}
                  >
                    {project.name} — {project.category}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {state.phase === 'projectOpening'
        && selectedProject
        && bridgeBounds
        && (
          <ProjectTransitionBridge
            sourceBounds={bridgeBounds}
            project={selectedProject}
            direction="open"
            reducedMotion={reducedMotion}
            onHandoff={handleOpenBridgeHandoff}
            onComplete={handleOpenBridgeComplete}
          />
        )}

      {state.phase === 'projectShowcase' && selectedProject && (
        <ProjectShowcase project={selectedProject} onReturn={beginReturn} />
      )}

      {state.phase === 'projectReturning'
        && selectedProject
        && bridgeBounds
        && (
          <ProjectTransitionBridge
            sourceBounds={bridgeBounds}
            project={selectedProject}
            direction="close"
            reducedMotion={reducedMotion}
            onHandoff={handleCloseBridgeHandoff}
            onComplete={handleCloseBridgeComplete}
          />
        )}
    </main>
  );
}

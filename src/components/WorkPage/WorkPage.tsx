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
import type { ScreenBounds } from '@/webgl/workSphere/activation';
import { buildProjectSlots } from '@/webgl/workSphere/geometry';
import { nextKeyboardSlot } from '@/webgl/workSphere/selection';
import type { WorkSphereTransitionSnapshot } from '@/webgl/workSphere/types';
import { WorkBrowseMeta } from './WorkBrowseMeta';
import { WorkFallback } from './WorkFallback';
import { WorkOpening } from './WorkOpening';
import { WorkProjectTransition } from './WorkProjectTransition';
import { WorkProjectView } from './WorkProjectView';
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
  const [moving, setMoving] = useState(false);
  const [transitionRect, setTransitionRect] = useState<ScreenBounds | null>(null);
  const [restoringSphere, setRestoringSphere] = useState(false);
  const [returnViewHidden, setReturnViewHidden] = useState(false);
  const [fallbackProjectIndex, setFallbackProjectIndex] = useState<number | null>(null);
  const reducedMotion = useMemo(readReducedMotion, []);
  const slots = useMemo(() => buildProjectSlots(projects.length), [projects.length]);
  const sphereRef = useRef<WorkSphereHandle>(null);
  const preOpenSnapshotRef = useRef<WorkSphereTransitionSnapshot | null>(null);
  const resolvedSnapshotRef = useRef<WorkSphereTransitionSnapshot | null>(null);
  const resolvedRectRef = useRef<ScreenBounds | null>(null);
  const returnTweenRef = useRef<gsap.core.Tween | null>(null);
  const semanticButtonRefs = useRef(new Map<number, HTMLButtonElement>());
  const suppressSemanticSnapRef = useRef(false);

  const browseSlot = slots.find(slot => slot.id === activeSlotId);
  const browseProject = browseSlot ? projects[browseSlot.projectIndex] ?? null : null;
  const selectedProject = state.selection ? projects[state.selection.projectIndex] ?? null : null;
  const fallbackProject = fallbackProjectIndex === null ? null : projects[fallbackProjectIndex] ?? null;
  const fallbackActive = capabilityFailed && state.phase !== 'opening';
  const projectViewing = state.phase === 'projectViewing';
  const projectReturning = state.phase === 'projectReturning';

  useEffect(() => {
    const shouldLockScroll = state.phase !== 'empty'
      && state.phase !== 'projectViewing'
      && !fallbackActive;
    document.documentElement.classList.toggle('work-page-scroll-locked', shouldLockScroll);
    return () => document.documentElement.classList.remove('work-page-scroll-locked');
  }, [fallbackActive, state.phase]);

  useEffect(() => () => {
    returnTweenRef.current?.kill();
  }, []);

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
    return () => {
      tween.kill();
    };
  }, [capabilityFailed, reducedMotion, state.phase]);

  const openSlot = useCallback((slotId: number) => {
    if (state.phase !== 'sphereInteractive') return;
    const sphere = sphereRef.current;
    if (!sphere) return;
    const projectIndex = sphere.getProjectIndexForSlot(slotId);
    const project = projects[projectIndex];
    if (!project) return;

    const snapshot = sphere.captureTransitionSnapshot();
    if (!snapshot) return;
    preOpenSnapshotRef.current = snapshot;
    resolvedSnapshotRef.current = null;
    resolvedRectRef.current = null;
    setTransitionRect(null);
    setReturnViewHidden(false);
    sphere.setInteractive(false);
    sphere.setProjectOpenProgress(0);
    sphere.setSelectedSlotHidden(null);
    sphere.beginResolveToSlot(slotId);
    dispatch({
      type: 'OPEN_PROJECT',
      selection: { slotId, projectIndex, projectSlug: project.slug },
    });
  }, [projects, state.phase]);

  useEffect(() => {
    if (state.phase !== 'projectResolving' || !state.selection) return undefined;
    const sphere = sphereRef.current;
    if (!sphere) return undefined;
    let raf = 0;
    let cancelled = false;

    const inspect = () => {
      if (cancelled) return;
      const status = sphere.getResolveStatus();
      if (!status?.ready) {
        raf = requestAnimationFrame(inspect);
        return;
      }

      const snapshot = sphere.captureTransitionSnapshot();
      const rect = sphere.getSlotScreenBounds(state.selection!.slotId);
      if (snapshot) resolvedSnapshotRef.current = snapshot;
      if (rect) {
        resolvedRectRef.current = rect;
        setTransitionRect(rect);
        dispatch({ type: 'PROJECT_RESOLVED' });
        return;
      }

      sphere.setProjectOpenProgress(1);
      sphere.stop();
      dispatch({ type: 'PROJECT_RESOLVED' });
      dispatch({ type: 'PROJECT_EXPANDED' });
    };

    raf = requestAnimationFrame(inspect);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [state.phase, state.selection]);

  const handleOpenOwnership = useCallback(() => {
    if (!state.selection) return;
    sphereRef.current?.setSelectedSlotHidden(state.selection.slotId);
  }, [state.selection]);

  const handleOpenProgress = useCallback((progress: number) => {
    sphereRef.current?.setProjectOpenProgress(progress);
  }, []);

  const handleOpenComplete = useCallback(() => {
    sphereRef.current?.setProjectOpenProgress(1);
    sphereRef.current?.stop();
    setTransitionRect(null);
    setReturnViewHidden(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
    dispatch({ type: 'PROJECT_EXPANDED' });
  }, []);

  const requestReturn = useCallback(() => {
    if (fallbackProjectIndex !== null) {
      setFallbackProjectIndex(null);
      return;
    }
    if (state.phase !== 'projectViewing') return;

    const commit = () => dispatch({ type: 'RETURN_PROJECT' });
    if (reducedMotion || window.scrollY <= 2) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      commit();
      return;
    }

    const startedAt = performance.now();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const check = () => {
      if (window.scrollY <= 2 || performance.now() - startedAt > 700) {
        window.scrollTo({ top: 0, behavior: 'auto' });
        commit();
        return;
      }
      requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  }, [fallbackProjectIndex, reducedMotion, state.phase]);

  useEffect(() => {
    if (state.phase !== 'projectReturning' || !state.selection) return undefined;
    const sphere = sphereRef.current;
    const resolvedSnapshot = resolvedSnapshotRef.current;
    if (!sphere || !resolvedSnapshot) {
      setReturnViewHidden(false);
      dispatch({ type: 'PROJECT_RETURNED' });
      return undefined;
    }

    sphere.start();
    sphere.setInteractive(false);
    sphere.restoreTransitionSnapshot(resolvedSnapshot);
    sphere.setProjectOpenProgress(1);
    sphere.setSelectedSlotHidden(state.selection.slotId);

    const raf = requestAnimationFrame(() => {
      const rect = sphere.getSlotScreenBounds(state.selection!.slotId) ?? resolvedRectRef.current;
      if (rect) {
        resolvedRectRef.current = rect;
        setReturnViewHidden(true);
        setTransitionRect(rect);
      } else {
        const preOpen = preOpenSnapshotRef.current;
        if (preOpen) sphere.restoreTransitionSnapshot(preOpen);
        sphere.setSelectedSlotHidden(null);
        sphere.setProjectOpenProgress(0);
        sphere.setInteractive(true);
        setReturnViewHidden(false);
        dispatch({ type: 'PROJECT_RETURNED' });
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [state.phase, state.selection]);

  const handleCloseOwnership = useCallback(() => {
    sphereRef.current?.setSelectedSlotHidden(null);
  }, []);

  const handleCloseProgress = useCallback(() => {
    sphereRef.current?.setProjectOpenProgress(1);
  }, []);

  const handleCloseComplete = useCallback(() => {
    const sphere = sphereRef.current;
    const preOpen = preOpenSnapshotRef.current;
    if (!sphere || !preOpen) {
      setReturnViewHidden(false);
      dispatch({ type: 'PROJECT_RETURNED' });
      return;
    }

    setTransitionRect(null);
    setRestoringSphere(true);
    if (state.selection) sphere.setSelectedSlotHidden(state.selection.slotId);
    sphere.restoreTransitionSnapshot(preOpen);
    sphere.setProjectOpenProgress(1);

    requestAnimationFrame(() => {
      sphere.setSelectedSlotHidden(null);
      setRestoringSphere(false);
      const progress = { value: 1 };
      returnTweenRef.current?.kill();
      returnTweenRef.current = gsap.to(progress, {
        value: 0,
        duration: reducedMotion ? 0.18 : 0.56,
        ease: reducedMotion ? 'power1.out' : 'power3.out',
        onUpdate: () => sphere.setProjectOpenProgress(progress.value),
        onComplete: () => {
          sphere.setProjectOpenProgress(0);
          sphere.setInteractive(true);
          const slotId = state.selection?.slotId;
          setReturnViewHidden(false);
          dispatch({ type: 'PROJECT_RETURNED' });
          requestAnimationFrame(() => {
            const button = semanticButtonRefs.current.get(slotId ?? -1);
            if (!button) return;
            suppressSemanticSnapRef.current = true;
            button.focus();
            suppressSemanticSnapRef.current = false;
          });
        },
      });
    });
  }, [reducedMotion, state.selection]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && state.phase === 'projectViewing') {
        event.preventDefault();
        requestReturn();
        return;
      }
      if (state.phase !== 'sphereInteractive' || !event.key.startsWith('Arrow')) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('input,textarea,select')) return;
      event.preventDefault();
      const delta = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
      const next = nextKeyboardSlot(activeSlotId, delta, slots.length);
      if (next >= 0) {
        sphereRef.current?.snapToSlot(next);
        setActiveSlotId(next);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeSlotId, requestReturn, slots.length, state.phase]);

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
        {fallbackProject ? (
          <WorkProjectView project={fallbackProject} focusOnMount onBack={requestReturn} />
        ) : (
          <WorkFallback projects={projects} onSelect={setFallbackProjectIndex} />
        )}
      </main>
    );
  }

  return (
    <main className={styles.page} data-work-phase={state.phase}>
      <div
        className={styles.viewport}
        data-project-viewing={projectViewing ? 'true' : 'false'}
      >
        <div
          className={styles.sphereLayer}
          data-hidden={state.phase === 'opening' ? 'true' : 'false'}
          data-restoring={restoringSphere ? 'true' : 'false'}
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
              onMovementChange={setMoving}
              onProjectActivate={openSlot}
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
                  ref={element => {
                    if (element) semanticButtonRefs.current.set(slot.id, element);
                    else semanticButtonRefs.current.delete(slot.id);
                  }}
                  type="button"
                  className={styles.semanticButton}
                  data-work-semantic-project
                  onFocus={() => {
                    if (!suppressSemanticSnapRef.current) sphereRef.current?.snapToSlot(slot.id);
                  }}
                  onClick={() => openSlot(slot.id)}
                >
                  {project.name} — {project.category}
                </button>
              );
            })}
          </div>
        )}

        {state.phase === 'projectExpanding' && selectedProject && transitionRect && (
          <WorkProjectTransition
            project={selectedProject}
            sourceRect={transitionRect}
            direction="open"
            reducedMotion={reducedMotion}
            onOwnership={handleOpenOwnership}
            onProgress={handleOpenProgress}
            onComplete={handleOpenComplete}
          />
        )}

        {projectReturning && selectedProject && transitionRect && (
          <WorkProjectTransition
            project={selectedProject}
            sourceRect={transitionRect}
            direction="close"
            reducedMotion={reducedMotion}
            onOwnership={handleCloseOwnership}
            onProgress={handleCloseProgress}
            onComplete={handleCloseComplete}
          />
        )}
      </div>

      {(projectViewing || projectReturning) && selectedProject && (
        <div
          className={styles.projectViewShell}
          data-returning={returnViewHidden ? 'true' : 'false'}
        >
          <WorkProjectView
            project={selectedProject}
            focusOnMount={projectViewing}
            onBack={requestReturn}
          />
        </div>
      )}
    </main>
  );
}

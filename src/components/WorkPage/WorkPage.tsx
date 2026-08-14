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
  const reducedMotion = useMemo(readReducedMotion, []);
  const slots = useMemo(() => buildProjectSlots(projects.length), [projects.length]);
  const sphereRef = useRef<WorkSphereHandle>(null);
  const semanticRefs = useRef(new Map<number, HTMLButtonElement>());

  const browseSlotId = hoverSlotId ?? activeSlotId;
  const browseSlot = slots.find(slot => slot.id === browseSlotId);
  const browseProject = browseSlot ? projects[browseSlot.projectIndex] ?? null : null;
  const fallbackActive = capabilityFailed && state.phase !== 'opening';

  useEffect(() => {
    const shouldLockScroll = state.phase !== 'empty' && !fallbackActive;
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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
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
  }, [activeSlotId, slots.length, state.phase]);

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
                  onClick={() => sphereRef.current?.snapToSlot(slot.id)}
                >
                  {project.name} — {project.category}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

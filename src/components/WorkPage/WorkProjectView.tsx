'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import type { WorkProject } from '@/content/workProjects';
import { getWorkProjectDestination, type WorkTransitionRect } from './WorkProjectTransition';
import styles from './WorkPage.module.css';

type WorkProjectViewProps = {
  project: WorkProject;
  focusOnMount?: boolean;
  onBack(): void;
};

export function WorkProjectView({ project, focusOnMount = false, onBack }: WorkProjectViewProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [layout, setLayout] = useState<WorkTransitionRect | null>(null);
  const [useFallback, setUseFallback] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const videoUrl = (useFallback && project.media.showcaseFallback) || project.media.showcaseVideo;
  const handleVideoError = () => {
    if (!useFallback && project.media.showcaseFallback) setUseFallback(true);
    else setVideoFailed(true);
  };
  const aspectRatio = project.media.aspectRatio ?? 1.6;

  useLayoutEffect(() => {
    const update = () => setLayout(
      getWorkProjectDestination(window.innerWidth, window.innerHeight, aspectRatio),
    );
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [aspectRatio]);

  useEffect(() => {
    if (focusOnMount) headingRef.current?.focus({ preventScroll: true });
  }, [focusOnMount]);

  const measuredStyle = layout
    ? { width: `${layout.width}px`, maxWidth: 'calc(100vw - 36px)' }
    : undefined;
  const mediaStyle: CSSProperties | undefined = layout
    ? {
        width: `${layout.width}px`,
        maxWidth: 'calc(100vw - 36px)',
        height: `${layout.height}px`,
        aspectRatio,
      }
    : { aspectRatio };

  return (
    <section
      className={styles.projectView}
      data-work-project-view
      style={layout ? { paddingTop: `${layout.top}px` } : undefined}
    >
      <div className={styles.projectViewMedia} style={mediaStyle}>
        {project.placeholder ? (
          <img src={project.media.showcasePoster || project.media.poster} alt="" />
        ) : (
          <video
            key={`${videoUrl}:${attempt}`}
            className={styles.projectViewVideo}
            aria-label={`${project.name} video showcase`}
            controls
            muted
            preload="metadata"
            playsInline
            hidden={videoFailed}
            onError={handleVideoError}
            poster={project.media.showcasePoster}
          >
            <source src={videoUrl} type={useFallback ? 'video/webm' : 'video/mp4'} onError={handleVideoError} />
          </video>
        )}
        {videoFailed && (
          <div className={styles.projectVideoError} role="status">
            <p>The video couldn’t load.</p>
            <button type="button" onClick={() => {
              setVideoFailed(false);
              setUseFallback(false);
              setAttempt(value => value + 1);
            }}>Retry video</button>
            <a href={videoUrl} target="_blank" rel="noreferrer">Open video file ↗</a>
          </div>
        )}
      </div>

      <div className={styles.projectViewInfo} style={measuredStyle}>
        <div className={styles.projectViewLead}>
          <p>{project.category}</p>
          <h1 ref={headingRef} tabIndex={-1}>{project.name}</h1>
          <p className={styles.projectViewBrief}>{project.brief}</p>
        </div>

        <dl className={styles.projectViewFacts}>
          <div>
            <dt>Services</dt>
            <dd>{project.services.join(' / ')}</dd>
          </div>
          {project.year ? (
            <div>
              <dt>Year</dt>
              <dd>{project.year}</dd>
            </div>
          ) : null}
        </dl>

        {project.placeholder ? (
          <span className={styles.projectPlaceholderLink}>Development placeholder</span>
        ) : (
          <a className={styles.projectVisitLink} href={project.liveUrl} target="_blank" rel="noreferrer">
            Visit Website ↗
          </a>
        )}

        <button type="button" className={styles.projectBackButton} onClick={onBack}>
          ← Back to Work
        </button>
      </div>
    </section>
  );
}

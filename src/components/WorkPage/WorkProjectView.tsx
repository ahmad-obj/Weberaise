'use client';

import { useEffect, useRef } from 'react';
import type { WorkProject } from '@/content/workProjects';
import styles from './WorkPage.module.css';

type WorkProjectViewProps = {
  project: WorkProject;
  focusOnMount?: boolean;
  onBack(): void;
};

export function WorkProjectView({ project, focusOnMount = false, onBack }: WorkProjectViewProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (focusOnMount) headingRef.current?.focus({ preventScroll: true });
  }, [focusOnMount]);

  return (
    <section className={styles.projectView} data-work-project-view>
      <div className={styles.projectViewMedia}>
        {project.placeholder ? (
          <img src={project.media.showcasePoster || project.media.poster} alt="" />
        ) : (
          <video
            className={styles.projectViewVideo}
            controls
            preload="metadata"
            playsInline
            poster={project.media.showcasePoster}
            src={project.media.showcaseVideo}
          />
        )}
      </div>

      <div className={styles.projectViewInfo}>
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
          <div>
            <dt>Year</dt>
            <dd>{project.year}</dd>
          </div>
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

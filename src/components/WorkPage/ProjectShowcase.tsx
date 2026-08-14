import { useEffect, useRef } from 'react';
import type { WorkProject } from '@/content/workProjects';
import styles from './WorkPage.module.css';

type ProjectShowcaseProps = {
  project: WorkProject;
  onReturn(): void;
  focusBackButton?: boolean;
};

export function ProjectShowcase({
  project,
  onReturn,
  focusBackButton = true,
}: ProjectShowcaseProps) {
  const backRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (focusBackButton) backRef.current?.focus({ preventScroll: true });
  }, [focusBackButton]);

  return (
    <section
      className={styles.showcase}
      aria-labelledby={`work-${project.slug}-title`}
      data-project-showcase
    >
      <div className={styles.showcaseTopbar}>
        <button ref={backRef} className={styles.backButton} type="button" onClick={onReturn}>
          <span aria-hidden="true">←</span> Back to Work
        </button>
      </div>

      <div className={styles.showcaseVideoFrame}>
        <video
          className={styles.showcaseVideo}
          poster={project.media.showcasePoster}
          src={project.media.showcaseVideo}
          controls
          preload="metadata"
          playsInline
        />
      </div>

      <div className={styles.showcaseInfo}>
        <div className={styles.showcaseLead}>
          <p className={styles.showcaseEyebrow}>{project.category}</p>
          <h1 id={`work-${project.slug}-title`}>{project.name}</h1>
        </div>
        <p className={styles.showcaseBrief}>{project.brief}</p>
        <dl className={styles.showcaseFacts}>
          <div>
            <dt>Services</dt>
            <dd>{project.services.join(' / ')}</dd>
          </div>
          <div>
            <dt>Year</dt>
            <dd>{project.year}</dd>
          </div>
        </dl>
        <a
          className={styles.visitLink}
          href={project.liveUrl}
          target="_blank"
          rel="noreferrer"
        >
          Visit Website <span aria-hidden="true">↗</span>
        </a>
      </div>
    </section>
  );
}

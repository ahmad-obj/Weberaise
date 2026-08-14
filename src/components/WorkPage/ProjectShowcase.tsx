'use client';

import { useEffect, useRef, useState } from 'react';
import type { WorkProject } from '@/content/workProjects';
import styles from './WorkPage.module.css';
import placeholderStyles from './PlaceholderShowcase.module.css';

type ProjectShowcaseProps = {
  project: WorkProject;
  onReturn(): void;
  focusBackButton?: boolean;
};

function PlaceholderShowcaseMedia() {
  const [playing, setPlaying] = useState(false);

  return (
    <div
      className={placeholderStyles.placeholderShowcase}
      data-playing={playing ? 'true' : 'false'}
      aria-label="Development placeholder full project showcase"
    >
      <div className={placeholderStyles.placeholderShowcaseViewport} aria-hidden="true">
        <div className={placeholderStyles.placeholderShowcaseChrome}>
          <span>PXX</span>
          <i />
          <i />
          <i />
        </div>
        <div className={placeholderStyles.placeholderShowcaseTrack}>
          <div className={placeholderStyles.placeholderShowcaseHero}>
            <p>FULL PROJECT</p>
            <strong>PLACEHOLDER SHOWCASE</strong>
            <span />
          </div>
          {Array.from({ length: 6 }, (_, index) => (
            <div className={placeholderStyles.placeholderShowcaseRow} key={index}>
              <b />
              <span>
                <i />
                <i />
                <i />
              </span>
            </div>
          ))}
        </div>
      </div>
      <button
        className={placeholderStyles.placeholderPlayButton}
        type="button"
        onClick={() => setPlaying(value => !value)}
        aria-pressed={playing}
      >
        {playing ? 'Pause placeholder showcase' : 'Play full placeholder showcase'}
      </button>
      <span className={placeholderStyles.placeholderMediaLabel}>DEV PLACEHOLDER</span>
    </div>
  );
}

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
        {project.placeholder ? (
          <PlaceholderShowcaseMedia />
        ) : (
          <video
            className={styles.showcaseVideo}
            poster={project.media.showcasePoster}
            src={project.media.showcaseVideo}
            controls
            preload="metadata"
            playsInline
          />
        )}
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
        {project.placeholder ? (
          <span
            className={styles.visitLink}
            aria-disabled="true"
            style={{ opacity: 0.45, cursor: 'default', borderBottomColor: 'transparent' }}
          >
            Website placeholder <span aria-hidden="true">↗</span>
          </span>
        ) : (
          <a
            className={styles.visitLink}
            href={project.liveUrl}
            target="_blank"
            rel="noreferrer"
          >
            Visit Website <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
    </section>
  );
}

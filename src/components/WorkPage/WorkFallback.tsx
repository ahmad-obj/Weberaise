'use client';

import type { WorkProject } from '@/content/workProjects';
import styles from './WorkPage.module.css';

type WorkFallbackProps = {
  projects: readonly WorkProject[];
  onSelect(projectIndex: number): void;
};

export function WorkFallback({ projects, onSelect }: WorkFallbackProps) {
  return (
    <section className={styles.fallback} aria-labelledby="work-fallback-title">
      <header>
        <p className={styles.fallbackKicker}>SELECTED WORK</p>
        <h1 id="work-fallback-title">OUR WORKS</h1>
      </header>
      <div className={styles.fallbackGrid}>
        {projects.map((project, projectIndex) => (
          <button
            key={project.slug}
            type="button"
            className={styles.fallbackProject}
            onClick={() => onSelect(projectIndex)}
          >
            <img src={project.media.poster} alt="" />
            <span>
              <strong>{project.name}</strong>
              <small>{project.category}</small>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

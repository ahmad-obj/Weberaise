'use client';

import type { WorkProject } from '@/content/workProjects';
import styles from './WorkPage.module.css';

type WorkFallbackProps = {
  projects: readonly WorkProject[];
};

export function WorkFallback({ projects }: WorkFallbackProps) {
  return (
    <section className={styles.fallback} aria-labelledby="work-fallback-title">
      <header>
        <p className={styles.fallbackKicker}>SELECTED WORK</p>
        <h1 id="work-fallback-title">OUR WORKS</h1>
      </header>
      <div className={styles.fallbackGrid}>
        {projects.map(project => (
          <article key={project.slug} className={styles.fallbackProject}>
            <img src={project.media.poster} alt="" />
            <span>
              <strong>{project.name}</strong>
              <small>{project.category}</small>
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}

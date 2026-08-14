'use client';

import { useState } from 'react';
import type { WorkProject } from '@/content/workProjects';
import { ProjectShowcase } from './ProjectShowcase';
import styles from './WorkPage.module.css';

type WorkFallbackProps = {
  projects: readonly WorkProject[];
};

export function WorkFallback({ projects }: WorkFallbackProps) {
  const [selected, setSelected] = useState<WorkProject | null>(null);

  if (selected) {
    return <ProjectShowcase project={selected} onReturn={() => setSelected(null)} />;
  }

  return (
    <section className={styles.fallback} aria-labelledby="work-fallback-title">
      <header>
        <p className={styles.fallbackKicker}>SELECTED WORK</p>
        <h1 id="work-fallback-title">OUR WORKS</h1>
      </header>
      <div className={styles.fallbackGrid}>
        {projects.map(project => (
          <button
            key={project.slug}
            type="button"
            className={styles.fallbackProject}
            onClick={() => setSelected(project)}
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

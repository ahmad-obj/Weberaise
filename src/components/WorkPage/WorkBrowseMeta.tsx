import type { WorkProject } from '@/content/workProjects';
import styles from './WorkPage.module.css';

type WorkBrowseMetaProps = {
  project: WorkProject | null;
  moving: boolean;
  visible: boolean;
};

export function WorkBrowseMeta({ project, moving, visible }: WorkBrowseMetaProps) {
  if (!project) return null;
  return (
    <div
      className={styles.browseMeta}
      data-moving={moving ? 'true' : 'false'}
      data-visible={visible ? 'true' : 'false'}
      aria-live="polite"
    >
      <strong>{project.name}</strong>
      <span>{project.category}</span>
    </div>
  );
}

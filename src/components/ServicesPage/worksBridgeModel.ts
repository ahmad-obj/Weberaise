import { WORK_PROJECTS } from '@/content/workProjects';

/** Work and Services always resolve a project to the same poster and preview. */
export const WORKS_BRIDGE_ITEMS = WORK_PROJECTS.map(project => ({
  id: project.slug,
  image: project.media.poster,
  video: project.media.teaserPreview || project.media.browsePreview,
}));

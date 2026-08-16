import type { WorkProject } from './workProjects';

const HTTP_URL = /^https?:\/\//i;
const FOUR_DIGIT_YEAR = /^\d{4}$/;

export function validateWorkProject(project: WorkProject): string[] {
  const errors: string[] = [];
  const textFields: Array<[string, string]> = [
    ['slug', project.slug],
    ['name', project.name],
    ['category', project.category],
    ['brief', project.brief],
  ];

  for (const [field, value] of textFields) {
    if (!value.trim()) errors.push(field);
  }

  if (!project.services.length || project.services.some(service => !service.trim())) {
    errors.push('services');
  }
  if (!FOUR_DIGIT_YEAR.test(project.year)) errors.push('year');
  if (!HTTP_URL.test(project.liveUrl)) errors.push('liveUrl');

  for (const field of ['poster', 'browsePreview', 'showcasePoster', 'showcaseVideo'] as const) {
    if (!project.media[field]?.trim()) errors.push(field);
  }

  return errors;
}

export function assertWorkProjectsValid(projects: readonly WorkProject[]): void {
  const invalid = projects.flatMap(project => {
    const errors = validateWorkProject(project);
    return errors.length ? [`${project.slug || '<missing-slug>'}: ${errors.join(', ')}`] : [];
  });

  if (invalid.length) {
    throw new Error(`Invalid Work project data:\n${invalid.join('\n')}`);
  }
}

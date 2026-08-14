export type WorkProjectMedia = {
  poster: string;
  browsePreview: string;
  showcasePoster: string;
  showcaseVideo: string;
};

export type WorkProject = {
  slug: string;
  name: string;
  category: string;
  brief: string;
  services: readonly string[];
  year: string;
  liveUrl: string;
  media: WorkProjectMedia;
};

/**
 * Production portfolio records live here only after copy/media are verified.
 * Keeping this empty is intentional: the Work page renders an honest empty
 * state rather than inventing client proof.
 */
export const WORK_PROJECTS: readonly WorkProject[] = [];

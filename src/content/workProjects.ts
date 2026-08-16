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
  /** Development-only visual fixture. Never present this record as client proof. */
  placeholder?: boolean;
};

const PLACEHOLDER_POSTER = '/work/placeholders/poster.svg';
const PLACEHOLDER_PREVIEW = 'placeholder://procedural-preview';
const PLACEHOLDER_SHOWCASE = 'placeholder://procedural-showcase';

/**
 * Temporary development fixtures so the complete Work interaction can be
 * viewed before verified client media is available. These are intentionally
 * named PLACEHOLDER and must be replaced with real project records before
 * production portfolio launch.
 */
export const WORK_PROJECTS: readonly WorkProject[] = [
  {
    slug: 'placeholder-01',
    name: 'PLACEHOLDER 01',
    category: 'WEB DESIGN / DEVELOPMENT',
    brief: 'Development placeholder used to exercise the complete Work showcase interaction.',
    services: ['Website Design', 'Development'],
    year: '2026',
    liveUrl: 'https://example.com',
    placeholder: true,
    media: {
      poster: PLACEHOLDER_POSTER,
      browsePreview: PLACEHOLDER_PREVIEW,
      showcasePoster: PLACEHOLDER_POSTER,
      showcaseVideo: PLACEHOLDER_SHOWCASE,
    },
  },
  {
    slug: 'placeholder-02',
    name: 'PLACEHOLDER 02',
    category: 'WEBSITE REDESIGN',
    brief: 'Development placeholder used to exercise the complete Work showcase interaction.',
    services: ['Website Redesign'],
    year: '2026',
    liveUrl: 'https://example.com',
    placeholder: true,
    media: {
      poster: PLACEHOLDER_POSTER,
      browsePreview: PLACEHOLDER_PREVIEW,
      showcasePoster: PLACEHOLDER_POSTER,
      showcaseVideo: PLACEHOLDER_SHOWCASE,
    },
  },
  {
    slug: 'placeholder-03',
    name: 'PLACEHOLDER 03',
    category: 'LANDING PAGE',
    brief: 'Development placeholder used to exercise the complete Work showcase interaction.',
    services: ['Landing Page'],
    year: '2026',
    liveUrl: 'https://example.com',
    placeholder: true,
    media: {
      poster: PLACEHOLDER_POSTER,
      browsePreview: PLACEHOLDER_PREVIEW,
      showcasePoster: PLACEHOLDER_POSTER,
      showcaseVideo: PLACEHOLDER_SHOWCASE,
    },
  },
  {
    slug: 'placeholder-04',
    name: 'PLACEHOLDER 04',
    category: 'E-COMMERCE',
    brief: 'Development placeholder used to exercise the complete Work showcase interaction.',
    services: ['E-commerce'],
    year: '2026',
    liveUrl: 'https://example.com',
    placeholder: true,
    media: {
      poster: PLACEHOLDER_POSTER,
      browsePreview: PLACEHOLDER_PREVIEW,
      showcasePoster: PLACEHOLDER_POSTER,
      showcaseVideo: PLACEHOLDER_SHOWCASE,
    },
  },
  {
    slug: 'placeholder-05',
    name: 'PLACEHOLDER 05',
    category: 'BUSINESS SYSTEM',
    brief: 'Development placeholder used to exercise the complete Work showcase interaction.',
    services: ['Business System'],
    year: '2026',
    liveUrl: 'https://example.com',
    placeholder: true,
    media: {
      poster: PLACEHOLDER_POSTER,
      browsePreview: PLACEHOLDER_PREVIEW,
      showcasePoster: PLACEHOLDER_POSTER,
      showcaseVideo: PLACEHOLDER_SHOWCASE,
    },
  },
  {
    slug: 'placeholder-06',
    name: 'PLACEHOLDER 06',
    category: 'OPTIMIZATION / SUPPORT',
    brief: 'Development placeholder used to exercise the complete Work showcase interaction.',
    services: ['Optimization', 'Support'],
    year: '2026',
    liveUrl: 'https://example.com',
    placeholder: true,
    media: {
      poster: PLACEHOLDER_POSTER,
      browsePreview: PLACEHOLDER_PREVIEW,
      showcasePoster: PLACEHOLDER_POSTER,
      showcaseVideo: PLACEHOLDER_SHOWCASE,
    },
  },
];

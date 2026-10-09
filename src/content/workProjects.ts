export type WorkProjectMedia = {
  poster: string;
  browsePreview: string;
  showcasePoster: string;
  showcaseVideo: string;
  /** Lower resolution preview for the small Services wall tiles. */
  teaserPreview?: string;
  /** Independent codec/container fallback for browsers that cannot decode MP4. */
  showcaseFallback?: string;
  /** Display ratio of the pre-cropped showcase video. */
  aspectRatio?: number;
};

export type WorkProject = {
  slug: string;
  name: string;
  category: string;
  brief: string;
  services: readonly string[];
  year?: string;
  liveUrl: string;
  media: WorkProjectMedia;
  /** Development-only visual fixture. Never present this record as client proof. */
  placeholder?: boolean;
};

const BROWSER_CAPTURE_ASPECT_RATIO = 1280 / 628;

/** Curated Work videos supplied for the current portfolio update. */
export const WORK_PROJECTS: readonly WorkProject[] = [
  {
    slug: 'sound-angels-headphones',
    name: 'Sound Angels',
    category: '3D PRODUCT EXPERIENCE',
    brief: 'An interactive 3D headphone product experience.',
    services: ['Web Design', 'Development'],
    liveUrl: 'https://coil-head-phones3d.vercel.app',
    media: {
      poster: '/work/projects/sound-angels/poster.webp',
      browsePreview: '/work/projects/sound-angels/browse.mp4',
      showcasePoster: '/work/projects/sound-angels/showcase-poster.webp',
      showcaseVideo: '/work/projects/sound-angels/showcase.mp4',
      showcaseFallback: '/work/projects/sound-angels/showcase.webm',
      teaserPreview: '/work/projects/sound-angels/teaser.mp4',
      aspectRatio: BROWSER_CAPTURE_ASPECT_RATIO,
    },
  },
  {
    slug: 'playstation-collection',
    name: 'PlayStation CD Collection',
    category: 'INTERACTIVE COLLECTION',
    brief: 'A digital collection celebrating classic PlayStation game discs.',
    services: ['Web Design', 'Development'],
    liveUrl: 'https://playstation1cds.manbtd0.workers.dev/collection',
    media: {
      poster: '/work/projects/playstation-collection/poster.webp',
      browsePreview: '/work/projects/playstation-collection/browse.mp4',
      showcasePoster: '/work/projects/playstation-collection/showcase-poster.webp',
      showcaseVideo: '/work/projects/playstation-collection/showcase.mp4',
      showcaseFallback: '/work/projects/playstation-collection/showcase.webm',
      teaserPreview: '/work/projects/playstation-collection/teaser.mp4',
      aspectRatio: BROWSER_CAPTURE_ASPECT_RATIO,
    },
  },
  {
    slug: 'porsche-911-gt3-r',
    name: 'Porsche 911 GT3 R',
    category: '3D AUTOMOTIVE EXPERIENCE',
    brief: 'A cinematic 3D study of the Porsche 911 GT3 R.',
    services: ['Web Design', 'Development'],
    liveUrl: 'https://3dcarweb.manbtd0.workers.dev',
    media: {
      poster: '/work/projects/porsche-911-gt3-r/poster.webp',
      browsePreview: '/work/projects/porsche-911-gt3-r/browse.mp4',
      showcasePoster: '/work/projects/porsche-911-gt3-r/showcase-poster.webp',
      showcaseVideo: '/work/projects/porsche-911-gt3-r/showcase.mp4',
      showcaseFallback: '/work/projects/porsche-911-gt3-r/showcase.webm',
      teaserPreview: '/work/projects/porsche-911-gt3-r/teaser.mp4',
      aspectRatio: BROWSER_CAPTURE_ASPECT_RATIO,
    },
  },
];

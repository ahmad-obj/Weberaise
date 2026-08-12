export type TrailPathDefinition = {
  viewBox: string;
  d: string;
};

// Temporary art-direction path. Keep geometry isolated here so later route changes
// never require animation changes.
export const DESKTOP_TRAIL: TrailPathDefinition = {
  viewBox: '0 0 1000 1000',
  d: [
    'M 0 82',
    'C 72 82 100 150 178 184',
    'C 292 234 326 370 488 438',
    'C 640 502 776 424 940 492',
    'C 852 548 762 610 650 640',
    'C 520 676 396 684 244 720',
    'C 340 784 458 820 590 830',
    'C 708 840 774 818 842 872',
  ].join(' '),
};

export const MOBILE_TRAIL: TrailPathDefinition = {
  viewBox: '0 0 600 1000',
  d: [
    'M 0 86',
    'C 54 86 72 148 124 182',
    'C 190 228 214 358 314 430',
    'C 398 490 480 450 570 506',
    'C 504 560 438 610 362 646',
    'C 286 682 214 694 116 724',
    'C 182 780 258 820 350 834',
    'C 430 846 486 828 536 876',
  ].join(' '),
};

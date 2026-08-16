export type WorksBridgeItem = {
  id: string;
  image: string;
  placeholder: boolean;
};

export const WORKS_BRIDGE_ITEMS = [
  { id: 'work-preview-01', image: '/work/placeholders/work-preview-01.svg', placeholder: true },
  { id: 'work-preview-02', image: '/work/placeholders/work-preview-02.svg', placeholder: true },
  { id: 'work-preview-03', image: '/work/placeholders/work-preview-03.svg', placeholder: true },
  { id: 'work-preview-04', image: '/work/placeholders/work-preview-04.svg', placeholder: true },
  { id: 'work-preview-05', image: '/work/placeholders/work-preview-05.svg', placeholder: true },
  { id: 'work-preview-06', image: '/work/placeholders/work-preview-06.svg', placeholder: true },
] as const satisfies readonly WorksBridgeItem[];

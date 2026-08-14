export type CapabilityPosition = 'left' | 'mid' | 'right';

export type CapabilityItem = {
  name: string;
  position: CapabilityPosition;
};

export type CapabilityGroup = {
  index: '01' | '02' | '03';
  label: 'DESIGN' | 'DEVELOPMENT' | 'IMPROVEMENT';
  items: readonly [CapabilityItem, CapabilityItem, CapabilityItem, CapabilityItem];
};

export const CAPABILITY_GROUPS = [
  {
    index: '01',
    label: 'DESIGN',
    items: [
      { name: 'Art Direction', position: 'left' },
      { name: 'UI/UX', position: 'right' },
      { name: 'Responsive', position: 'mid' },
      { name: 'Motion', position: 'right' },
    ],
  },
  {
    index: '02',
    label: 'DEVELOPMENT',
    items: [
      { name: 'Frontend', position: 'mid' },
      { name: 'CMS', position: 'left' },
      { name: 'Integrations', position: 'right' },
      { name: 'E-commerce', position: 'mid' },
    ],
  },
  {
    index: '03',
    label: 'IMPROVEMENT',
    items: [
      { name: 'Performance', position: 'right' },
      { name: 'SEO Foundations', position: 'left' },
      { name: 'Analytics', position: 'mid' },
      { name: 'Iteration', position: 'right' },
    ],
  },
] as const satisfies readonly CapabilityGroup[];

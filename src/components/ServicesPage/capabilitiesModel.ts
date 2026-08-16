export type CapabilityGroup = {
  index: '01' | '02' | '03';
  label: 'DESIGN' | 'DEVELOPMENT' | 'IMPROVEMENT';
  items: readonly [string, string, string, string];
};

export const CAPABILITY_GROUPS = [
  {
    index: '01',
    label: 'DESIGN',
    items: ['Art Direction', 'UI/UX', 'Responsive', 'Motion'],
  },
  {
    index: '02',
    label: 'DEVELOPMENT',
    items: ['Frontend', 'CMS', 'Integrations', 'E-commerce'],
  },
  {
    index: '03',
    label: 'IMPROVEMENT',
    items: ['Performance', 'SEO Foundations', 'Analytics', 'Iteration'],
  },
] as const satisfies readonly CapabilityGroup[];

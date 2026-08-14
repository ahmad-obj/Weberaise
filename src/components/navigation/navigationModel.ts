export type NavigationMode = 'hero' | 'main';

export const CENTER_NAV_ITEMS = [
  { key: 'services', label: 'SERVICES', href: '/services' },
  { key: 'work', label: 'WORK', href: '#work' },
  { key: 'about', label: 'ABOUT', href: '#about' },
] as const;

export type CenterNavKey = (typeof CENTER_NAV_ITEMS)[number]['key'];

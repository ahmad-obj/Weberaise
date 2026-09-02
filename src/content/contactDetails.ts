export type ContactDetailKind = 'email' | 'phone' | 'whatsapp' | 'social';

export type ContactDetail = {
  kind: ContactDetailKind;
  label: string;
  value: string;
  href: string;
  external?: boolean;
};

export const CONTACT_DETAILS: readonly ContactDetail[] = [
  {
    kind: 'whatsapp',
    label: 'PHONE / WHATSAPP',
    value: '+92 325 9622759',
    href: 'https://wa.me/923259622759',
    external: true,
  },
  {
    kind: 'social',
    label: 'INSTAGRAM',
    value: 'Instagram',
    href: 'https://instagram.com/weberaise',
    external: true,
  },
  {
    kind: 'social',
    label: 'LINKEDIN',
    value: 'LinkedIn',
    href: 'https://www.linkedin.com/company/140193912/',
    external: true,
  },
];

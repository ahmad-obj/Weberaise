export type ContactDetailKind = 'email' | 'phone' | 'whatsapp' | 'social';

export type ContactDetail = {
  kind: ContactDetailKind;
  label: string;
  value: string;
  href: string;
  external?: boolean;
};

/**
 * Populate only with contact channels that have been explicitly verified for Weberaise.
 * Unverified channels stay absent; the Contact ending handles an empty list cleanly.
 */
export const CONTACT_DETAILS: readonly ContactDetail[] = [];

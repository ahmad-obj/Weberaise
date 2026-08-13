export type ServiceEntry = {
  id: string;
  index: string;
  title: string;
  lead: string;
  primary: readonly string[];
  secondary: readonly string[];
};

export const SERVICES = [
  {
    id: 'website-design-development',
    index: '01',
    title: 'WEBSITE DESIGN & DEVELOPMENT',
    lead: 'A complete website system — structured, designed and built around how the business needs to present itself.',
    primary: ['Strategy & Structure', 'UI/UX Design', 'Frontend Development'],
    secondary: ['Responsive Build', 'CMS & Integrations', 'Launch QA'],
  },
  {
    id: 'website-redesign',
    index: '02',
    title: 'WEBSITE REDESIGN',
    lead: 'For websites that work technically but no longer represent the quality, clarity or direction of the business.',
    primary: ['Audit & Diagnosis', 'UX Restructure', 'Visual Redesign'],
    secondary: ['Performance Cleanup', 'Content Migration', 'Relaunch QA'],
  },
  {
    id: 'landing-pages',
    index: '03',
    title: 'LANDING PAGES',
    lead: 'Focused campaign and offer pages built to communicate one thing quickly, clearly and convincingly.',
    primary: ['Message & Hierarchy', 'Conversion UX', 'Rapid Build'],
    secondary: ['Analytics', 'A/B-ready Structure', 'Campaign Integrations'],
  },
  {
    id: 'ecommerce-business-systems',
    index: '04',
    title: 'E-COMMERCE / BUSINESS SYSTEMS',
    lead: 'Digital systems where the website has to do real operational work — selling, collecting, organising or connecting.',
    primary: ['Storefront UX', 'Product / Service Flows', 'Integrations'],
    secondary: ['CMS / Admin', 'Commerce & Payments', 'Operational Workflows'],
  },
  {
    id: 'optimization-support',
    index: '05',
    title: 'OPTIMIZATION & SUPPORT',
    lead: 'Ongoing technical improvement for websites that need to stay fast, measurable, maintained and useful.',
    primary: ['Performance', 'SEO Foundations', 'Analytics'],
    secondary: ['Maintenance', 'Iteration', 'Technical Support'],
  },
] as const satisfies readonly ServiceEntry[];

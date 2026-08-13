export type ServiceEntry = {
  id: string;
  index: string;
  title: string;
  primary: readonly string[];
  secondary: readonly string[];
};

export const SERVICES = [
  {
    id: 'website-design-development',
    index: '01',
    title: 'WEBSITE DESIGN & DEVELOPMENT',
    primary: ['Strategy & Structure', 'UI/UX Design', 'Frontend Development'],
    secondary: ['Responsive Build', 'CMS & Integrations', 'SEO Foundations', 'Analytics Setup', 'Launch QA'],
  },
  {
    id: 'website-redesign',
    index: '02',
    title: 'WEBSITE REDESIGN',
    primary: ['Audit & Diagnosis', 'UX Restructure', 'Visual Redesign'],
    secondary: ['Performance Cleanup', 'Content Migration', 'Responsive Rebuild', 'SEO Preservation', 'Relaunch QA'],
  },
  {
    id: 'landing-pages',
    index: '03',
    title: 'LANDING PAGES',
    primary: ['Message & Hierarchy', 'Conversion UX', 'Rapid Build'],
    secondary: ['Analytics', 'A/B-ready Structure', 'Campaign Integrations', 'Forms & Tracking', 'Performance QA'],
  },
  {
    id: 'ecommerce-business-systems',
    index: '04',
    title: 'E-COMMERCE / BUSINESS SYSTEMS',
    primary: ['Storefront UX', 'Product / Service Flows', 'Integrations'],
    secondary: ['CMS / Admin', 'Commerce & Payments', 'Operational Workflows', 'Product Setup', 'Analytics & Tracking'],
  },
  {
    id: 'optimization-support',
    index: '05',
    title: 'OPTIMIZATION & SUPPORT',
    primary: ['Performance', 'SEO Foundations', 'Analytics'],
    secondary: ['Maintenance', 'Iteration', 'Technical Support', 'Core Web Vitals', 'Reporting'],
  },
] as const satisfies readonly ServiceEntry[];
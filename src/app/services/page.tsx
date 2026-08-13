import type { Metadata } from 'next';
import { ServicesPage } from '@/components/ServicesPage/ServicesPage';

export const metadata: Metadata = {
  title: 'Services — WEBERAISE',
  description: 'Explore WEBERAISE website design, development, redesign, landing page, commerce, optimization and support services.',
};

export default function ServicesRoute() {
  return <ServicesPage />;
}

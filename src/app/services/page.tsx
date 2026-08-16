import type { Metadata } from 'next';
import { ServicesPage } from '@/components/ServicesPage/ServicesPage';
import { ServicesHashHandoff } from '@/components/ServicesPage/ServicesHashHandoff';
import { WorksBridge } from '@/components/ServicesPage/WorksBridge';
import { ServicesTailEnvironment } from '@/components/ServicesPage/ServicesTailEnvironment';
import { SiteNavigation } from '@/components/navigation/SiteNavigation';
import { SilkWavesBackground } from '@/components/ui/SilkWavesBackground/SilkWavesBackground';
import styles from './ServicesRoute.module.css';

export const metadata: Metadata = {
  title: 'Services — WEBERAISE',
  description: 'Explore WEBERAISE website design, development, redesign, landing page, commerce, optimization and support services.',
};

export default function ServicesRoute() {
  return (
    <div className={styles.route}>
      <SiteNavigation mode="main" layer="route" />
      <SilkWavesBackground activeTargetId="services-tail-environment" />
      <div className={styles.upstream}>
        <ServicesPage />
        <ServicesHashHandoff />
        <WorksBridge />
      </div>
      <ServicesTailEnvironment />
    </div>
  );
}

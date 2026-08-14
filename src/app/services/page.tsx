import type { Metadata } from 'next';
import { ServicesPage } from '@/components/ServicesPage/ServicesPage';
import { WorksBridge } from '@/components/ServicesPage/WorksBridge';
import { ServicesTailEnvironment } from '@/components/ServicesPage/ServicesTailEnvironment';
import { SilkWavesBackground } from '@/components/ui/SilkWavesBackground/SilkWavesBackground';
import styles from './ServicesRoute.module.css';

export const metadata: Metadata = {
  title: 'Services — WEBERAISE',
  description: 'Explore WEBERAISE website design, development, redesign, landing page, commerce, optimization and support services.',
};

export default function ServicesRoute() {
  return (
    <div className={styles.route}>
      <SilkWavesBackground activeTargetId="services-tail-environment" />
      <div className={styles.upstream}>
        <ServicesPage />
        <WorksBridge />
      </div>
      <ServicesTailEnvironment />
    </div>
  );
}

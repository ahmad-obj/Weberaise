import type { Metadata } from 'next';
import { AboutPage } from '@/components/AboutPage/AboutPage';
import { FOUNDERS } from '@/components/AboutPage/aboutData';
import { SiteNavigation } from '@/components/navigation/SiteNavigation';
import { SilkWavesBackground } from '@/components/ui/SilkWavesBackground/SilkWavesBackground';
import styles from './AboutRoute.module.css';

export const metadata: Metadata = {
  title: 'About — WEBERAISE',
  description: 'Meet the two people behind WEBERAISE and how design and development work together.',
};

export default function AboutRoute() {
  return (
    <div className={styles.route}>
      <SiteNavigation mode="main" layer="route" />
      <SilkWavesBackground activeTargetId="about-opening" />
      <div className={styles.content}>
        <AboutPage founders={FOUNDERS} />
      </div>
    </div>
  );
}

import type { Metadata } from 'next';
import { WorkPage } from '@/components/WorkPage/WorkPage';
import { SiteNavigation } from '@/components/navigation/SiteNavigation';
import { assertWorkProjectsValid } from '@/content/workProjectValidation';
import { WORK_PROJECTS } from '@/content/workProjects';

export const metadata: Metadata = {
  title: 'Work — WEBERAISE',
  description: 'Selected websites designed and built by WEBERAISE.',
};

export default function WorkRoute() {
  assertWorkProjectsValid(WORK_PROJECTS);

  return (
    <>
      <SiteNavigation mode="main" layer="route" />
      <WorkPage projects={WORK_PROJECTS} />
    </>
  );
}

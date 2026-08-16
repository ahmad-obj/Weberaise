import type { Metadata } from 'next';
import { WorkPage } from '@/components/WorkPage/WorkPage';
import { assertWorkProjectsValid } from '@/content/workProjectValidation';
import { WORK_PROJECTS } from '@/content/workProjects';

export const metadata: Metadata = {
  title: 'Work — WEBERAISE',
  description: 'Selected websites designed and built by WEBERAISE.',
};

export default function WorkRoute() {
  assertWorkProjectsValid(WORK_PROJECTS);
  return <WorkPage projects={WORK_PROJECTS} />;
}

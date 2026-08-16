import { AboutApproach } from './AboutApproach';
import { AboutIntro } from './AboutIntro';
import { FoundersSection } from './FoundersSection';
import type { Founder } from './founderTypes';

export function AboutPage({ founders }: { founders: readonly [Founder, Founder] }) {
  return (
    <main>
      <AboutIntro />
      <FoundersSection founders={founders} />
      <AboutApproach />
    </main>
  );
}

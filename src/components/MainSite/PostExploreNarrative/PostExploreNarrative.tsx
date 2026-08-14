import { postExploreCopy } from '@/content/homepage';
import { AuroraStatement } from './AuroraStatement';
import { GrowthRing } from './GrowthRing';
import { JourneyNarrative } from './JourneyNarrative';
import styles from './PostExploreNarrative.module.css';

export function PostExploreNarrative() {
  return (
    <section
      id="post-explore"
      className={styles.root}
      data-post-explore-narrative
      data-nav-theme="dark"
    >
      <JourneyNarrative
        questions={postExploreCopy.questions}
        reassurance={postExploreCopy.reassurance}
      />
      <section className={styles.purposeSection} data-post-explore-purpose>
        <AuroraStatement
          lead={postExploreCopy.statementLead}
          aurora={postExploreCopy.statementAurora}
        />
        <GrowthRing text={postExploreCopy.ring} center={postExploreCopy.ringCenter} />
      </section>
    </section>
  );
}

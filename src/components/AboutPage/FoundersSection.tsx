import { FounderPortraitCard } from './FounderPortraitCard';
import type { Founder } from './founderTypes';
import styles from './AboutPage.module.css';

export function FoundersSection({ founders }: { founders: readonly [Founder, Founder] }) {
  return (
    <section className={styles.foundersSection} aria-labelledby="about-people-heading">
      <div className={styles.foundersGrid}>
        <div className={styles.peopleIntro}>
          <p className={styles.kicker}>02 // THE PEOPLE</p>
          <h2 id="about-people-heading" className={styles.peopleHeading}>
            THE PEOPLE<br />
            BEHIND<br />
            WEBERAISE.
          </h2>
          <p className={styles.peopleNote}>
            Two people, different strengths, one shared standard for the work.
          </p>
        </div>

        {founders.map((founder) => (
          <FounderPortraitCard key={founder.id} founder={founder} />
        ))}
      </div>
    </section>
  );
}

import styles from './AboutPage.module.css';

export function AboutIntro() {
  return (
    <section
      id="about-opening"
      className={styles.opening}
      aria-labelledby="about-opening-heading"
    >
      <div className={styles.openingInner}>
        <p className={styles.kicker}>// ABOUT.</p>
        <h1 id="about-opening-heading" className={styles.openingHeading}>
          <span>WE&apos;RE WEBERAISE.</span>
          <span>A TWO-PERSON DIGITAL STUDIO</span>
          <span>BUILT AROUND DESIGN AND DEVELOPMENT.</span>
        </h1>
        <p className={styles.openingNote}>
          We work closely from first idea to final build, keeping design and development together from the start.
        </p>
      </div>
    </section>
  );
}

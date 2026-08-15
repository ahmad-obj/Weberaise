import styles from './AboutPage.module.css';

const PRINCIPLES = [
  {
    label: '01 / FOCUSED',
    text: 'We keep the work close, clear and intentional.',
  },
  {
    label: '02 / COLLABORATIVE',
    text: 'Design and development move together instead of being handed off.',
  },
  {
    label: '03 / DELIBERATE',
    text: 'Every interaction and technical choice should earn its place.',
  },
] as const;

export function AboutApproach() {
  const year = new Date().getFullYear();

  return (
    <section className={styles.approach} aria-labelledby="about-approach-heading">
      <div className={styles.approachMain}>
        <div className={styles.approachIntro}>
          <p className={styles.kicker}>03 // HOW WE WORK</p>
          <h2 id="about-approach-heading" className={styles.approachHeading}>
            HOW WE WORK.
          </h2>
        </div>

        <div className={styles.principles}>
          {PRINCIPLES.map((principle) => (
            <article className={styles.principle} key={principle.label}>
              <p>{principle.label}</p>
              <span>{principle.text}</span>
            </article>
          ))}
        </div>
      </div>

      <footer className={styles.footerRail}>
        <span>WEBERAISE</span>
        <span>© {year}</span>
      </footer>
    </section>
  );
}

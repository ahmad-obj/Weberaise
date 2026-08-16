import { CAPABILITY_GROUPS } from './capabilitiesModel';
import styles from './CapabilitiesSection.module.css';

export function CapabilitiesSection() {
  return (
    <section className={styles.section} aria-labelledby="services-capabilities-heading">
      <header className={styles.intro}>
        <p className={styles.kicker}>// CAPABILITIES.</p>
        <h2 id="services-capabilities-heading" className={styles.heading}>
          The disciplines we bring together to shape, build and improve digital experiences.
        </h2>
      </header>

      <div className={styles.groups}>
        {CAPABILITY_GROUPS.map((group) => (
          <section
            className={styles.group}
            key={group.label}
            aria-labelledby={`capability-${group.index}`}
          >
            <h3 id={`capability-${group.index}`} className={styles.groupLabel}>
              <span>{group.index}</span>
              <span aria-hidden="true">//</span>
              <span>{group.label}</span>
            </h3>

            <ul className={styles.list}>
              {group.items.map((item) => (
                <li className={styles.item} key={item}>
                  <span className={styles.name}>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}

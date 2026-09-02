import { CONTACT_DETAILS } from '@/content/contactDetails';
import styles from './ContactEnding.module.css';

const PRIMARY_DETAILS = CONTACT_DETAILS.filter((item) =>
  item.kind === 'email' || item.kind === 'phone' || item.kind === 'whatsapp'
);

const SOCIAL_DETAILS = CONTACT_DETAILS.filter((item) => item.kind === 'social');

export function ContactEnding() {
  const year = new Date().getFullYear();

  return (
    <section id="contact" className={styles.section} aria-labelledby="services-contact-heading">
      <div className={styles.main}>
        <p className={styles.kicker}>// CONTACT.</p>
        <h2 id="services-contact-heading" className={styles.heading}>
          CONTACT US
        </h2>

        {(PRIMARY_DETAILS.length > 0 || SOCIAL_DETAILS.length > 0) && (
          <div className={styles.directory}>
            {PRIMARY_DETAILS.map((item) => (
              <div className={styles.contactBlock} key={`${item.kind}-${item.label}`}>
                <p className={styles.label}>{item.label}</p>
                <a
                  className={styles.value}
                  href={item.href}
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noreferrer' : undefined}
                >
                  <span>{item.value}</span>
                  <span className={styles.arrow} aria-hidden="true">↗</span>
                </a>
              </div>
            ))}

            {SOCIAL_DETAILS.length > 0 && (
              <div className={styles.socialBlock}>
                <p className={styles.label}>SOCIAL</p>
                <div className={styles.socialLinks}>
                  {SOCIAL_DETAILS.map((item) => (
                    <a
                      className={styles.socialLink}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      key={item.label}
                    >
                      <span>{item.value}</span>
                      <span className={styles.arrow} aria-hidden="true">↗</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <footer className={styles.footer}>
        <span>WEBERAISE</span>
        <span>© {year}</span>
      </footer>
    </section>
  );
}

import { CapabilitiesSection } from './CapabilitiesSection';
import styles from './ServicesTailEnvironment.module.css';

export function ServicesTailEnvironment() {
  return (
    <div id="services-tail-environment" className={styles.tail}>
      <div className={styles.transitionVeil} aria-hidden="true" />
      <CapabilitiesSection />
      <div className={styles.contactReserve} aria-hidden="true" />
    </div>
  );
}

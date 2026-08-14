import { DriftWall } from '@/components/ui/DriftWall/DriftWall';
import { GooeyLink } from '@/components/ui/GooeyLink/GooeyLink';
import { WORKS_BRIDGE_ITEMS } from './worksBridgeModel';
import styles from './WorksBridge.module.css';

export function WorksBridge() {
  return (
    <section className={styles.bridge} aria-labelledby="works-bridge-heading">
      <div className={styles.main}>
        <div className={styles.statementWrap}>
          <h2 id="works-bridge-heading" className={styles.statement}>
            <span>WE COULD KEEP</span>
            <span>TELLING YOU.</span>
            <span className={styles.statementBreak}>OR WE COULD</span>
            <span>SHOW YOU.</span>
          </h2>
        </div>

        <div className={styles.wallStage} aria-hidden="true">
          <DriftWall
            items={WORKS_BRIDGE_ITEMS}
            columns={3}
            speed={30}
            variance={0.22}
            tilt={10}
            turn={-10}
            perspective={1400}
            depth={90}
            parallax={0.42}
            lift={42}
          />
        </div>
      </div>

      <div className={styles.ctaWrap}>
        <GooeyLink href="/work" label="VIEW OUR WORK" className={styles.cta} />
      </div>
    </section>
  );
}

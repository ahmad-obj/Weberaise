// Visual basis: https://magicui.design/docs/components/aurora-text
// Source: https://github.com/magicuidesign/magicui/blob/main/apps/www/registry/magicui/aurora-text.tsx

import styles from './PostExploreNarrative.module.css';

export function AuroraStatement({ lead, aurora }: { lead: string; aurora: string }) {
  return (
    <h2 className={styles.statement}>
      <span className={styles.statementLead}>{lead}</span>
      <span className={styles.auroraText}>{aurora}</span>
    </h2>
  );
}

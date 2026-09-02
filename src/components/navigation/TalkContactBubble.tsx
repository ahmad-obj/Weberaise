import { CONTACT_DETAILS } from '@/content/contactDetails';
import styles from './Navigation.module.css';

type TalkContactBubbleProps = {
  id: string;
  open: boolean;
  onClose: () => void;
};

export function TalkContactBubble({ id, open, onClose }: TalkContactBubbleProps) {
  return (
    <div
      id={id}
      className={styles.contactBubble}
      data-open={open ? 'true' : 'false'}
      role="dialog"
      aria-label="Contact Weberaise"
      aria-hidden={!open}
      inert={!open ? true : undefined}
    >
      <div className={styles.contactBubbleHeader}>
        <div>
          <span className={styles.contactBubbleEyebrow}>// CONTACT.</span>
          <p className={styles.contactBubbleTitle}>Choose a channel</p>
        </div>
        <button
          type="button"
          className={styles.contactBubbleClose}
          onClick={onClose}
          aria-label="Close contact options"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4.25 4.25 11.75 11.75M11.75 4.25 4.25 11.75" />
          </svg>
        </button>
      </div>

      <div className={styles.contactBubbleDirectory}>
        {CONTACT_DETAILS.map((item, index) => (
          <a
            className={styles.contactBubbleItem}
            href={item.href}
            target={item.external ? '_blank' : undefined}
            rel={item.external ? 'noreferrer' : undefined}
            onClick={onClose}
            style={{ '--contact-item-index': index } as React.CSSProperties}
            key={`${item.kind}-${item.label}`}
          >
            <span className={styles.contactBubbleItemCopy}>
              <span className={styles.contactBubbleLabel}>{item.label}</span>
              <span className={styles.contactBubbleValue}>{item.value}</span>
            </span>
            <span className={styles.contactBubbleArrow} aria-hidden="true">↗</span>
          </a>
        ))}
      </div>
    </div>
  );
}

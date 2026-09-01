import Image from 'next/image';
import styles from './LoaderCountdownDecoration.module.css';

type LoaderCountdownDecorationProps = {
  hidden: boolean;
};

export function LoaderCountdownDecoration({ hidden }: LoaderCountdownDecorationProps) {
  return (
    <div
      className={styles.root}
      data-hidden={hidden ? 'true' : 'false'}
      aria-hidden="true"
    >
      <div className={styles.content}>
        <Image
          src="/brand/weberaise-horizontal-on-dark.svg"
          alt=""
          width={1800}
          height={430}
          priority
          draggable={false}
          className={styles.logo}
        />
        <span className={styles.label}>LOADING</span>
      </div>
    </div>
  );
}

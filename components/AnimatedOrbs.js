import styles from './AnimatedOrbs.module.css';

export default function AnimatedOrbs() {
  return (
    <div className={styles.container}>
      <div className={`${styles.orb} ${styles.orb1}`} />
      <div className={`${styles.orb} ${styles.orb2}`} />
      <div className={`${styles.orb} ${styles.orb3}`} />
    </div>
  );
}

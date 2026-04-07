import styles from './Splash.module.css';

export function Splash() {
  return (
    <div className={styles.splash}>
      <div className={styles.logo}>
        <span className={styles.pill}>💊</span>
        <h1 className={styles.brand}>TezDavo</h1>
        <p className={styles.tagline}>Аптека у вас дома</p>
      </div>
      <div className={styles.spinner} />
    </div>
  );
}

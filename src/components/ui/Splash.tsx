import styles from "./Splash.module.css";

export function Splash() {
  return (
    <div className={styles.splash}>
      <div className={styles.logo}>
        <img
          src="/icons/logo.png"
          width={56}
          height={56}
          style={{ objectFit: "contain" }}
          alt="pill"
        />
        <h1 className={styles.brand}>TezDavo</h1>
        <p className={styles.tagline}>Аптека у вас дома</p>
      </div>
      <div className={styles.spinner} />
    </div>
  );
}

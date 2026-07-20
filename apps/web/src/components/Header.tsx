import styles from "./Header.module.css";

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <span className={styles.logo}>読み切り漫画データベース</span>
      </div>
    </header>
  );
}

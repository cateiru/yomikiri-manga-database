import styles from "./Header.module.css";

interface HeaderProps {
  oneshotsCount: number;
}

export function Header({ oneshotsCount }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <span className={styles.logo}>読み切り漫画データベース</span>
        <span className={styles.count}>登録作品数 {oneshotsCount.toLocaleString()}</span>
      </div>
    </header>
  );
}

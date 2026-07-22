import Link from "next/link";
import styles from "./Header.module.css";

interface HeaderProps {
  oneshotsCount: number;
}

export function Header({ oneshotsCount }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          <img className={styles.logoIcon} src="/logo.svg" alt="" aria-hidden="true" />
          読み切り漫画データベース
        </Link>
        <span className={styles.count}>作品数 {oneshotsCount.toLocaleString()}</span>
        <nav className={styles.nav}>
          <Link href="/favorites">お気に入り</Link>
          <Link href="/about">このサイトについて</Link>
        </nav>
      </div>
    </header>
  );
}

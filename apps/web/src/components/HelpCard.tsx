import Link from "next/link";
import styles from "./HelpCard.module.css";

export function HelpCard() {
  return (
    <Link href="/help" className={styles.card}>
      <div className={styles.imageArea}>
        <svg className={styles.icon} viewBox="0 0 64 64" fill="none" role="img" aria-hidden="true">
          <circle cx="32" cy="32" r="24" stroke="currentColor" strokeWidth="2.5" />
          <path d="M32 28v16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <circle cx="32" cy="20" r="2.5" fill="currentColor" />
        </svg>
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>はじめての方はこちら</h3>
        <p className={styles.description}>読み切り漫画データベースの使い方をご紹介します。</p>
      </div>
    </Link>
  );
}

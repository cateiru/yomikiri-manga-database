import Link from "next/link";
import styles from "./HelpCard.module.css";

export function HelpCard() {
  return (
    <Link href="/help" className={styles.card}>
      <div className={styles.imageArea}>
        <span>このサイトの使い方</span>
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>はじめての方はこちら</h3>
        <p className={styles.description}>読み切り漫画データベースの使い方をご紹介します。</p>
      </div>
    </Link>
  );
}

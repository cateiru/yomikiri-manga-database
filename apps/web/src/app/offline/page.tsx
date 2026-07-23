import Link from "next/link";
import styles from "./page.module.css";

export default function OfflinePage() {
  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>オフラインです</h1>
      <p className={styles.message}>
        インターネット接続がありません。接続を確認してから、もう一度お試しください。
      </p>
      <Link href="/" className={styles.link}>
        トップページへ戻る
      </Link>
    </main>
  );
}

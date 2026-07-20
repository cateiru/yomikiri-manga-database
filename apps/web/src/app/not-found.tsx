import Link from "next/link";
import styles from "./not-found.module.css";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <main className={styles.main}>
      <p className={styles.code}>404</p>
      <h1 className={styles.heading}>ページが見つかりません</h1>
      <p className={styles.message}>お探しのページは移動または削除された可能性があります。</p>
      <Link href="/" className={styles.link}>
        トップページへ戻る
      </Link>
    </main>
  );
}

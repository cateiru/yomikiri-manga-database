import Link from "next/link";
import styles from "./page.module.css";

// RootLayout が getOneshotsCount() で DB へアクセスするため、ビルド時の
// プリレンダリングだと DB 接続が無い環境（CI 等）でビルドが失敗する。
// force-dynamic にして実行時（Service Worker の install 時にオンラインで
// fetch されるタイミング）にレンダリングさせる。
export const dynamic = "force-dynamic";

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

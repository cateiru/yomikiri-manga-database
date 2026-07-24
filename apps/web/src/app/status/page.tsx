import type { Metadata } from "next";
import { getStatusData } from "@/lib/status";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ステータス | 読み切り漫画データベース",
  robots: { index: false, follow: false },
};

export default async function StatusPage() {
  const { sourceCounts, genreCounts, pendingDetailsCount, totalVotesCount } = await getStatusData();

  const totalOneshotsCount = sourceCounts.reduce((sum, source) => sum + source.count, 0);

  return (
    <main className={styles.main}>
      <h1 className={styles.pageHeading}>ステータス</h1>

      <ul className={styles.statTiles}>
        <li className={styles.statTile}>
          <span className={styles.statLabel}>登録作品数</span>
          <span className={styles.statValue}>{totalOneshotsCount.toLocaleString()}</span>
        </li>
        <li className={styles.statTile}>
          <span className={styles.statLabel}>詳細取得中の作品数</span>
          <span className={styles.statValue}>{pendingDetailsCount.toLocaleString()}</span>
        </li>
        <li className={styles.statTile}>
          <span className={styles.statLabel}>全ジャンル投票数</span>
          <span className={styles.statValue}>{totalVotesCount.toLocaleString()}</span>
        </li>
      </ul>

      <section className={styles.section}>
        <h2 className={styles.heading}>Web漫画サービスごとの登録作品数</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Web漫画サービス</th>
              <th className={styles.numCell}>作品数</th>
            </tr>
          </thead>
          <tbody>
            {sourceCounts.map((source) => (
              <tr key={source.key}>
                <td>
                  <span className={styles.sourceName}>
                    <img
                      className={styles.favicon}
                      src={source.favicon}
                      alt=""
                      aria-hidden="true"
                    />
                    {source.name}
                  </span>
                </td>
                <td className={styles.numCell}>{source.count.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>ジャンル別の登録作品数</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ジャンル</th>
              <th className={styles.numCell}>作品数</th>
            </tr>
          </thead>
          <tbody>
            {genreCounts.map((genre) => (
              <tr key={genre.key}>
                <td>{genre.label}</td>
                <td className={styles.numCell}>{genre.count.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

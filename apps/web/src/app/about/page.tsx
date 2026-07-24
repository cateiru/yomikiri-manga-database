import type { Metadata } from "next";
import { ClearHistoryButton } from "@/components/ClearHistoryButton";
import { DataTransferButton } from "@/components/DataTransferButton";
import { getLatestDataUpdatedAt, getOneshotCountsBySource } from "@/lib/oneshots";
import { listSources } from "@/lib/sources";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "このサイトについて | 読み切り漫画データベース",
  description: "読み切り漫画データベースの概要と、掲載作品の取得元一覧",
};

const lastUpdatedFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function AboutPage() {
  const [lastUpdatedAt, sourceCounts] = await Promise.all([
    getLatestDataUpdatedAt(),
    getOneshotCountsBySource(),
  ]);
  const sources = listSources().filter((source) => (sourceCounts.get(source.key) ?? 0) > 0);

  return (
    <main className={styles.main}>
      <section className={styles.section}>
        <h1 className={styles.heading}>このサイトについて</h1>
        <p>
          世の中のWeb漫画サイトには数多くの読み切り作品があります。
          しかし、各サービスの新着作品を横断的に探すことは難しく、埋もれてしまう作品も少なくありません。
          素晴らしい作品はより多くの人に読まれるべきだと考え、読み切り漫画を横断的に収集するサービスを作りました。
        </p>
        <p>
          本サービスは、各漫画配信サービスに掲載されている読み切り漫画を横断的に収集し、
          一覧表示する非公式のサービスです。複数のサービスをまたいで新着の読み切りを探せるようにすることを目的としています。
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>データの取得元</h2>
        <p>掲載している作品の情報は、以下の各サービスの公開ページから定期的に取得しています。</p>
        <p>
          {lastUpdatedAt
            ? `データ最終更新: ${lastUpdatedFormatter.format(lastUpdatedAt)}`
            : "データ最終更新: 未実行"}
        </p>
        <ul className={styles.sourceList}>
          {sources.map((source) => (
            <li key={source.key} className={styles.sourceItem}>
              <img className={styles.favicon} src={source.favicon} alt="" aria-hidden="true" />
              <a href={source.siteUrl} target="_blank" rel="noopener noreferrer">
                {source.name}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>ご利用にあたって</h2>
        <p>
          各作品の閲覧は、リンク先の各サービスのページで行われます。作品の権利は各出版社・作者に帰属します。
          掲載内容の削除等のご要望は{" "}
          <a href="mailto:yomikiri-manga@cateiru.com">yomikiri-manga@cateiru.com</a>{" "}
          までご連絡ください。
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>データの引き継ぎ</h2>
        <p>
          既読・お気に入り・投票・スキップの記録は、通常この端末のブラウザ内にのみ保存されています。
          以下のボタンから引き継ぎコードを発行し、別の端末でそのコードを入力すると、記録を移行できます。
        </p>
        <DataTransferButton />
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>閲覧履歴の消去</h2>
        <p>
          既読・お気に入り・投票・スキップの記録は、この端末のブラウザ内にのみ保存されています。
          以下のボタンから、これらの記録をすべて消去できます。
        </p>
        <ClearHistoryButton />
      </section>
    </main>
  );
}

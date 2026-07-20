import type { Metadata } from "next";
import { listSources } from "@/lib/sources";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "このサイトについて | 読み切り漫画データベース",
  description: "読み切り漫画データベースの概要と、掲載作品の取得元一覧",
};

export default function AboutPage() {
  const sources = listSources();

  return (
    <main className={styles.main}>
      <section className={styles.section}>
        <h1 className={styles.heading}>このサイトについて</h1>
        <p>
          「読み切り漫画データベース」は、各漫画配信サービスに掲載されている読み切り漫画を横断的に収集し、
          一覧表示する非公式のサービスです。複数のサービスをまたいで新着の読み切りを探せるようにすることを目的としています。
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>データの取得元</h2>
        <p>
          掲載している作品の情報は、以下の各サービスの公開ページから定期的に取得しています。
        </p>
        <ul className={styles.sourceList}>
          {sources.map((source) => (
            <li key={source.key} className={styles.sourceItem}>
              <img
                className={styles.favicon}
                src={source.favicon}
                alt=""
                aria-hidden="true"
              />
              <a
                href={source.listUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
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
          <a href="mailto:yomikiri-manga@cateiru.com">
            yomikiri-manga@cateiru.com
          </a>{" "}
          までご連絡ください。
        </p>
      </section>
    </main>
  );
}

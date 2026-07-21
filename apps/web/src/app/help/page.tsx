import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "このサイトの使い方 | 読み切り漫画データベース",
  description: "読み切り漫画データベースの機能と使い方の紹介",
};

export default function HelpPage() {
  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>このサイトの使い方</h1>

      <section className={styles.section}>
        <h2 className={styles.heading}>読み切りを探す</h2>
        <p>
          トップページには、各漫画配信サービスに掲載されている読み切り作品が新着順に並びます。
          気になる作品のカードをクリックすると、掲載元のページが別タブで開きます。
          画面を下にスクロールすると、続きの作品が自動で読み込まれます。
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>ジャンルで絞り込む</h2>
        <p>
          一覧の上部にあるジャンルタグを選択すると、そのジャンルの作品だけを表示できます。
          複数選択すると、選んだいずれかのジャンルに該当する作品が表示されます。
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>読んだ作品を記録する</h2>
        <p>
          作品を開いてしばらくすると、その作品は「既読」として記録され、
          一覧上でカードのサムネイルが薄く表示されるようになります。
          既読の記録はこの端末のブラウザ内にのみ保存されます。
        </p>
        <p>
          読み終えてこのサイトに戻ってくると、読んだ作品のジャンルを教えてほしいという確認画面が表示されることがあります。
          回答は今後のジャンル分類の精度向上に役立てられます。回答したくない場合は「スキップ」を選択してください。
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>お気に入り</h2>
        <p>
          カード右上の星アイコンをクリックすると、その作品を
          <Link href="/favorites">お気に入り</Link>
          に登録できます。登録した作品はお気に入りページからいつでも確認できます。
          お気に入りの記録もこの端末のブラウザ内にのみ保存されます。
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>その他</h2>
        <p>
          サイトの目的や作品情報の取得元については
          <Link href="/about">このサイトについて</Link>
          をご覧ください。
        </p>
      </section>
    </main>
  );
}

import type { Metadata } from "next";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "プライバシーポリシー | 読み切り漫画データベース",
  description: "読み切り漫画データベースにおける個人情報・アクセス解析データの取り扱い",
};

export default function PrivacyPage() {
  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>プライバシーポリシー</h1>

      <section className={styles.section}>
        <h2 className={styles.subheading}>アクセス解析ツールについて</h2>
        <p>
          当サイトでは、サービス改善を目的として Google が提供するアクセス解析ツール「Google
          Analytics」を利用しています。 Google Analytics はトラフィックデータの収集のために Cookie
          を使用しますが、このデータは匿名で収集されており、個人を特定するものではありません。
        </p>
        <p>
          この機能は Cookie
          を無効にすることで収集を拒否することが出来ますので、お使いのブラウザの設定をご確認ください。
          この規約に関して、詳しくは
          <a
            href="https://marketingplatform.google.com/about/analytics/terms/jp/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Analytics利用規約
          </a>
          のページや
          <a
            href="https://policies.google.com/technologies/ads?hl=ja"
            target="_blank"
            rel="noopener noreferrer"
          >
            Googleポリシーと規約
          </a>
          のページをご覧ください。
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subheading}>取得する情報の範囲</h2>
        <p>
          当サイトは、既読・お気に入り・投票・スキップといった閲覧履歴を、原則としてサーバーに保存せず
          お使いの端末のブラウザ内（localStorage）にのみ保存しています（後述の「データ引き継ぎ機能」をご利用の場合を除く）。
          ジャンル投票の重複防止のためにブラウザ側で生成した匿名の識別子を利用しますが、氏名・メールアドレス等の
          個人を特定できる情報は収集していません。
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subheading}>データ引き継ぎ機能について</h2>
        <p>
          当サイトの「データ引き継ぎ」機能をご利用いただいた場合に限り、既読・お気に入り・投票・スキップの記録を、
          発行された引き継ぎコードに紐づけて一時的にサーバーへ保存します。この記録は同意いただいた場合にのみ保存され、
          引き継ぎコードの発行から24時間が経過した時点、またはコードが利用された時点のいずれか早い方で
          サーバーから完全に削除されます。この機能を利用しない限り、既読・お気に入り・投票・スキップの記録が
          サーバーに保存されることはありません。
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subheading}>お問い合わせ</h2>
        <p>
          本ポリシーに関するお問い合わせは{" "}
          <a href="mailto:yomikiri-manga@cateiru.com">yomikiri-manga@cateiru.com</a>{" "}
          までご連絡ください。
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subheading}>改定</h2>
        <p>
          当サイトは、個人情報に関して適用される日本の法令を遵守するとともに、本ポリシーの内容を適宜見直し、
          その改善に努めます。本ポリシーは、事前の予告なく変更することがあります。
        </p>
      </section>
    </main>
  );
}

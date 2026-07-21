import type { Metadata } from "next";
import { FavoritesView } from "@/components/FavoritesView";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "お気に入り | 読み切り漫画データベース",
  description: "お気に入りに登録した読み切り漫画の一覧",
};

export default function FavoritesPage() {
  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>お気に入り</h1>
      <FavoritesView />
    </main>
  );
}

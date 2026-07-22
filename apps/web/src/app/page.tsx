import { GenreFilter } from "@/components/GenreFilter";
import { OneshotsGrid } from "@/components/OneshotsGrid";
import { getDb } from "@/lib/db";
import { listGenres, normalizeGenreParam } from "@/lib/genres";
import { getOneshotsPage, HELP_CARD_COLUMN_SPAN, ONESHOTS_PAGE_SIZE } from "@/lib/oneshots";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

interface TopPageProps {
  searchParams: Promise<{ genre?: string | string[] }>;
}

export default async function TopPage({ searchParams }: TopPageProps) {
  const { genre } = await searchParams;
  const genreKeys = normalizeGenreParam(genre);

  const db = await getDb();
  const [genres, firstPage] = await Promise.all([
    listGenres(db),
    // 初回表示はヘルプ導線カード（2カラム分）を含めてグリッドの行が揃うよう、その分を差し引いて取得する
    getOneshotsPage(genreKeys, null, ONESHOTS_PAGE_SIZE - HELP_CARD_COLUMN_SPAN),
  ]);

  return (
    <main className={styles.main}>
      <GenreFilter genres={genres} />
      <OneshotsGrid
        key={genreKeys.join(",")}
        genreKeys={genreKeys}
        genres={genres}
        initialItems={firstPage.items}
        initialCursor={firstPage.nextCursor}
      />
    </main>
  );
}

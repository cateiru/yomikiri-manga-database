import { GenreFilter } from "@/components/GenreFilter";
import { OneshotsGrid } from "@/components/OneshotsGrid";
import { getDb } from "@/lib/db";
import { listGenres } from "@/lib/genres";
import { getOneshotsPage } from "@/lib/oneshots";
import styles from "./page.module.css";

export const revalidate = 300;

interface TopPageProps {
  searchParams: Promise<{ genre?: string | string[] }>;
}

function normalizeGenreParam(value: string | string[] | undefined): string[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

export default async function TopPage({ searchParams }: TopPageProps) {
  const { genre } = await searchParams;
  const genreKeys = normalizeGenreParam(genre);

  const db = getDb();
  const [genres, firstPage] = await Promise.all([listGenres(db), getOneshotsPage(genreKeys)]);

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

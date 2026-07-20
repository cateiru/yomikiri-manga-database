import { EmptyState } from "@/components/EmptyState";
import { GenreFilter } from "@/components/GenreFilter";
import { OneshotCard } from "@/components/OneshotCard";
import { getDb } from "@/lib/db";
import { listGenres } from "@/lib/genres";
import { getOneshotsList } from "@/lib/oneshots";
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
  const [genres, oneshotsList] = await Promise.all([listGenres(db), getOneshotsList(genreKeys)]);

  return (
    <main className={styles.main}>
      <GenreFilter genres={genres} />
      {oneshotsList.length === 0 ? (
        <EmptyState message="該当する読み切りが見つかりませんでした。" />
      ) : (
        <ul className={styles.grid}>
          {oneshotsList.map((item) => (
            <li key={item.id}>
              <OneshotCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

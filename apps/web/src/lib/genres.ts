import type { Db } from "@yomikiri/db/client-serverless";
import { genres } from "@yomikiri/db/schema";
import { asc } from "drizzle-orm";

export interface Genre {
  id: number;
  key: string;
  label: string;
}

export async function listGenres(db: Db): Promise<Genre[]> {
  return db
    .select({ id: genres.id, key: genres.key, label: genres.label })
    .from(genres)
    .orderBy(asc(genres.sortOrder));
}

/** searchParams の genre（単一 or 複数）を genreKeys の配列に正規化する */
export function normalizeGenreParam(value: string | string[] | undefined): string[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

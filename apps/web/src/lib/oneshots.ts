import type { Db } from "@yomikiri/db/client-serverless";
import { genres, genreVotes, oneshots } from "@yomikiri/db/schema";
import { and, desc, eq, exists, inArray, sql } from "drizzle-orm";
import { getDb } from "./db";

const TOP_GENRE_COUNT = 3;

export interface OneshotGenreBadge {
  id: number;
  key: string;
  label: string;
  votes: number;
}

export interface OneshotListItem {
  id: number;
  title: string;
  author: string | null;
  thumbnailUrl: string | null;
  viewerUrl: string;
  sourceKey: string;
  /** ISO 8601 文字列。掲載日時が無い場合は null */
  publishedAt: string | null;
  /** ISO 8601 文字列 */
  firstSeenAt: string;
  genres: OneshotGenreBadge[];
}

async function fetchOneshotsList(db: Db, genreKeys: string[]): Promise<OneshotListItem[]> {
  const sortKey = sql`coalesce(${oneshots.publishedAt}, ${oneshots.firstSeenAt})`;

  const filterCondition =
    genreKeys.length > 0
      ? exists(
          db
            .select({ one: sql`1` })
            .from(genreVotes)
            .innerJoin(genres, eq(genres.id, genreVotes.genreId))
            .where(and(eq(genreVotes.oneshotId, oneshots.id), inArray(genres.key, genreKeys))),
        )
      : undefined;

  const rows = await db
    .select({
      id: oneshots.id,
      title: oneshots.title,
      author: oneshots.author,
      thumbnailUrl: oneshots.thumbnailUrl,
      viewerUrl: oneshots.viewerUrl,
      sourceKey: oneshots.sourceKey,
      publishedAt: oneshots.publishedAt,
      firstSeenAt: oneshots.firstSeenAt,
    })
    .from(oneshots)
    .where(filterCondition)
    .orderBy(desc(sortKey));

  const oneshotIds = rows.map((row) => row.id);
  const voteRows =
    oneshotIds.length > 0
      ? await db
          .select({
            oneshotId: genreVotes.oneshotId,
            genreId: genres.id,
            genreKey: genres.key,
            genreLabel: genres.label,
            votes: sql<number>`count(*)`,
          })
          .from(genreVotes)
          .innerJoin(genres, eq(genres.id, genreVotes.genreId))
          .where(inArray(genreVotes.oneshotId, oneshotIds))
          .groupBy(genreVotes.oneshotId, genres.id, genres.key, genres.label)
      : [];

  const votesByOneshot = new Map<number, OneshotGenreBadge[]>();
  for (const row of voteRows) {
    const list = votesByOneshot.get(row.oneshotId) ?? [];
    list.push({
      id: row.genreId,
      key: row.genreKey,
      label: row.genreLabel,
      votes: Number(row.votes),
    });
    votesByOneshot.set(row.oneshotId, list);
  }

  return rows.map((row) => {
    const topGenres = (votesByOneshot.get(row.id) ?? [])
      .sort((a, b) => b.votes - a.votes || a.id - b.id)
      .slice(0, TOP_GENRE_COUNT);

    return {
      id: row.id,
      title: row.title,
      author: row.author,
      thumbnailUrl: row.thumbnailUrl,
      viewerUrl: row.viewerUrl,
      sourceKey: row.sourceKey,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      firstSeenAt: row.firstSeenAt.toISOString(),
      genres: topGenres,
    };
  });
}

export async function getOneshotsList(genreKeys: string[]): Promise<OneshotListItem[]> {
  return fetchOneshotsList(getDb(), genreKeys);
}

import type { Db } from "@yomikiri/db/client-serverless";
import { genres, genreVotes, oneshots } from "@yomikiri/db/schema";
import { and, asc, desc, eq, exists, inArray, or, type SQL, sql } from "drizzle-orm";
import { getDb } from "./db";

const TOP_GENRE_COUNT = 3;
export const ONESHOTS_PAGE_SIZE = 24;

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

export interface OneshotsCursor {
  /** date_trunc('day', coalesce(published_at, first_seen_at)) のISO文字列 */
  sortDay: string;
  /** hashtext(id::text)。日付グループ内の並び順を決める決定論的な疑似ランダムキー */
  rankKey: number;
  id: number;
}

export interface OneshotsPage {
  items: OneshotListItem[];
  nextCursor: OneshotsCursor | null;
}

// メディア(sourceKey)ごとに固まって表示されるのを防ぐため、日単位でグルーピングし、
// 同じ日の中では id から決定論的に導出した疑似ランダム順に並び替える
// (random()だとページをまたいだ際に順序が安定せずkeyset paginationと両立しないため)
const sortDayExpr = sql`date_trunc('day', coalesce(${oneshots.publishedAt}, ${oneshots.firstSeenAt}))`;
const rankKeyExpr = sql`hashtext(${oneshots.id}::text)`;

function buildGenreFilterCondition(db: Db, genreKeys: string[]): SQL | undefined {
  if (genreKeys.length === 0) {
    return undefined;
  }
  return exists(
    db
      .select({ one: sql`1` })
      .from(genreVotes)
      .innerJoin(genres, eq(genres.id, genreVotes.genreId))
      .where(and(eq(genreVotes.oneshotId, oneshots.id), inArray(genres.key, genreKeys))),
  );
}

function buildCursorCondition(cursor: OneshotsCursor | null): SQL | undefined {
  if (!cursor) {
    return undefined;
  }
  const cursorDay = sql`${cursor.sortDay}::timestamptz`;
  return or(
    sql`${sortDayExpr} < ${cursorDay}`,
    and(sql`${sortDayExpr} = ${cursorDay}`, sql`${rankKeyExpr} > ${cursor.rankKey}`),
    and(
      sql`${sortDayExpr} = ${cursorDay}`,
      sql`${rankKeyExpr} = ${cursor.rankKey}`,
      sql`${oneshots.id} > ${cursor.id}`,
    ),
  );
}

interface OneshotRow {
  id: number;
  title: string;
  author: string | null;
  thumbnailUrl: string | null;
  viewerUrl: string;
  sourceKey: string;
  publishedAt: Date | null;
  firstSeenAt: Date;
}

async function attachGenreBadges(db: Db, rows: OneshotRow[]): Promise<OneshotListItem[]> {
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

async function fetchOneshotsPage(
  db: Db,
  genreKeys: string[],
  cursor: OneshotsCursor | null,
): Promise<OneshotsPage> {
  const filterCondition = and(
    buildGenreFilterCondition(db, genreKeys),
    buildCursorCondition(cursor),
  );

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
      // date_trunc()の結果はNeonドライバーからDateではなく文字列として返るため、
      // 型は実際の返り値(string)に合わせる
      sortDay: sql<string>`${sortDayExpr}`.as("sort_day"),
      rankKey: sql<number>`${rankKeyExpr}`.as("rank_key"),
    })
    .from(oneshots)
    .where(filterCondition)
    .orderBy(desc(sortDayExpr), asc(rankKeyExpr), asc(oneshots.id))
    .limit(ONESHOTS_PAGE_SIZE + 1);

  const hasMore = rows.length > ONESHOTS_PAGE_SIZE;
  const pageRows = hasMore ? rows.slice(0, ONESHOTS_PAGE_SIZE) : rows;
  const items = await attachGenreBadges(db, pageRows);

  const last = pageRows.at(-1);
  const nextCursor: OneshotsCursor | null =
    hasMore && last
      ? { sortDay: new Date(last.sortDay).toISOString(), rankKey: last.rankKey, id: last.id }
      : null;

  return { items, nextCursor };
}

export async function getOneshotsPage(
  genreKeys: string[],
  cursor: OneshotsCursor | null = null,
): Promise<OneshotsPage> {
  return fetchOneshotsPage(getDb(), genreKeys, cursor);
}

export async function getOneshotById(id: number): Promise<OneshotListItem | null> {
  const db = getDb();
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
    .where(eq(oneshots.id, id))
    .limit(1);

  if (rows.length === 0) {
    return null;
  }
  const items = await attachGenreBadges(db, rows);
  return items[0] ?? null;
}

import type { Db } from "@yomikiri/db/client-serverless";
import { genres, genreVotes, oneshots } from "@yomikiri/db/schema";
import {
  and,
  asc,
  eq,
  exists,
  gt,
  inArray,
  isNotNull,
  isNull,
  lt,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
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
  /** ISO 8601 文字列。掲載日時が無い場合は null */
  publishedAt: string | null;
  title: string;
  id: number;
}

export interface OneshotsPage {
  items: OneshotListItem[];
  nextCursor: OneshotsCursor | null;
}

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

// ソートは公開日時（published_at）の新しい順、同着はタイトル昇順（NULLS LAST）。
// カーソルはこのソート順と一致させる必要があるため、cursor.publishedAt が
// null かどうかで「まだ published_at が非 null の範囲を走査中」か
// 「既に NULLS LAST グループ（published_at が null）を走査中」かを分岐する
function buildCursorCondition(cursor: OneshotsCursor | null): SQL | undefined {
  if (!cursor) {
    return undefined;
  }

  const titleTiebreak = or(
    gt(oneshots.title, cursor.title),
    and(eq(oneshots.title, cursor.title), gt(oneshots.id, cursor.id)),
  );

  if (cursor.publishedAt === null) {
    return and(isNull(oneshots.publishedAt), titleTiebreak);
  }

  const cursorPublishedAt = sql`${cursor.publishedAt}::timestamptz`;
  return or(
    lt(oneshots.publishedAt, cursorPublishedAt),
    and(eq(oneshots.publishedAt, cursorPublishedAt), titleTiebreak),
    isNull(oneshots.publishedAt),
  );
}

interface OneshotRow {
  id: number;
  title: string | null;
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
      // 呼び出し元は title IS NOT NULL でフィルタ済みのため非 null が保証される
      title: row.title as string,
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
  // 詳細取得バッチが未処理（title 未取得）の行は表示対象から除外する
  const filterCondition = and(
    isNotNull(oneshots.title),
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
    })
    .from(oneshots)
    .where(filterCondition)
    .orderBy(sql`${oneshots.publishedAt} desc nulls last`, asc(oneshots.title), asc(oneshots.id))
    .limit(ONESHOTS_PAGE_SIZE + 1);

  const hasMore = rows.length > ONESHOTS_PAGE_SIZE;
  const pageRows = hasMore ? rows.slice(0, ONESHOTS_PAGE_SIZE) : rows;
  const items = await attachGenreBadges(db, pageRows);

  const last = pageRows.at(-1);
  const nextCursor: OneshotsCursor | null =
    hasMore && last
      ? {
          publishedAt: last.publishedAt ? last.publishedAt.toISOString() : null,
          title: last.title as string,
          id: last.id,
        }
      : null;

  return { items, nextCursor };
}

export async function getOneshotsPage(
  genreKeys: string[],
  cursor: OneshotsCursor | null = null,
): Promise<OneshotsPage> {
  return fetchOneshotsPage(await getDb(), genreKeys, cursor);
}

export async function getOneshotsCount(): Promise<number> {
  const db = await getDb();
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(oneshots)
    .where(isNotNull(oneshots.title));

  return Number(row?.count ?? 0);
}

export async function getOneshotById(id: number): Promise<OneshotListItem | null> {
  const db = await getDb();
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
    .where(and(eq(oneshots.id, id), isNotNull(oneshots.title)))
    .limit(1);

  if (rows.length === 0) {
    return null;
  }
  const items = await attachGenreBadges(db, rows);
  return items[0] ?? null;
}

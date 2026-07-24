import type { Db } from "@yomikiri/db/client-serverless";
import { genres, genreVotes, oneshots } from "@yomikiri/db/schema";
import { asc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { getDb } from "./db";
import { listSources } from "./sources";

export interface SourceStatusCount {
  key: string;
  name: string;
  favicon: string;
  count: number;
}

export interface GenreStatusCount {
  key: string;
  label: string;
  count: number;
}

export interface StatusData {
  sourceCounts: SourceStatusCount[];
  genreCounts: GenreStatusCount[];
  pendingDetailsCount: number;
  totalVotesCount: number;
}

async function getSourceCounts(db: Db): Promise<SourceStatusCount[]> {
  const rows = await db
    .select({ sourceKey: oneshots.sourceKey, count: sql<number>`count(*)` })
    .from(oneshots)
    .where(isNotNull(oneshots.title))
    .groupBy(oneshots.sourceKey);

  const countsByKey = new Map(rows.map((row) => [row.sourceKey, Number(row.count)]));

  return listSources().map((source) => ({
    key: source.key,
    name: source.name,
    favicon: source.favicon,
    count: countsByKey.get(source.key) ?? 0,
  }));
}

async function getGenreCounts(db: Db): Promise<GenreStatusCount[]> {
  const rows = await db
    .select({
      key: genres.key,
      label: genres.label,
      count: sql<number>`count(distinct ${genreVotes.oneshotId})`,
    })
    .from(genres)
    .leftJoin(genreVotes, eq(genreVotes.genreId, genres.id))
    .groupBy(genres.id, genres.key, genres.label, genres.sortOrder)
    .orderBy(asc(genres.sortOrder));

  return rows.map((row) => ({ key: row.key, label: row.label, count: Number(row.count) }));
}

async function getPendingDetailsCount(db: Db): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(oneshots)
    .where(isNull(oneshots.detailsFetchedAt));

  return Number(row?.count ?? 0);
}

async function getTotalVotesCount(db: Db): Promise<number> {
  const [row] = await db.select({ count: sql<number>`count(*)` }).from(genreVotes);

  return Number(row?.count ?? 0);
}

export async function getStatusData(): Promise<StatusData> {
  const db = await getDb();
  const [sourceCounts, genreCounts, pendingDetailsCount, totalVotesCount] = await Promise.all([
    getSourceCounts(db),
    getGenreCounts(db),
    getPendingDetailsCount(db),
    getTotalVotesCount(db),
  ]);

  return { sourceCounts, genreCounts, pendingDetailsCount, totalVotesCount };
}

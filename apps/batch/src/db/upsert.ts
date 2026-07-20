import type { Db } from "@yomikiri/db/client-node";
import { oneshots } from "@yomikiri/db/schema";
import { eq, isNull } from "drizzle-orm";
import type { ParsedOneshotUrl, ParsedViewerDetail } from "../parsers/types.js";

export interface UpsertSummary {
  inserted: number;
  updated: number;
}

export async function upsertOneshotUrls(
  db: Db,
  sourceKey: string,
  items: ParsedOneshotUrl[],
): Promise<UpsertSummary> {
  const summary: UpsertSummary = { inserted: 0, updated: 0 };

  for (const item of items) {
    const now = new Date();

    const [row] = await db
      .insert(oneshots)
      .values({
        sourceKey,
        viewerUrl: item.viewerUrl,
        firstSeenAt: now,
        lastSeenAt: now,
      })
      .onConflictDoUpdate({
        target: [oneshots.sourceKey, oneshots.viewerUrl],
        // 詳細情報（title/author/thumbnailUrl/publishedAt/year/detailsFetchedAt）は
        // 詳細取得バッチのみが更新する。URL 収集バッチは lastSeenAt のみ更新する
        set: {
          lastSeenAt: now,
        },
      })
      .returning({ firstSeenAt: oneshots.firstSeenAt, lastSeenAt: oneshots.lastSeenAt });

    if (row && row.firstSeenAt.getTime() === row.lastSeenAt.getTime()) {
      summary.inserted += 1;
    } else {
      summary.updated += 1;
    }
  }

  return summary;
}

export interface DetailsQueueItem {
  id: number;
  sourceKey: string;
  viewerUrl: string;
}

export async function getUnfetchedOneshots(db: Db): Promise<DetailsQueueItem[]> {
  return db
    .select({ id: oneshots.id, sourceKey: oneshots.sourceKey, viewerUrl: oneshots.viewerUrl })
    .from(oneshots)
    .where(isNull(oneshots.detailsFetchedAt));
}

export async function updateOneshotDetail(
  db: Db,
  id: number,
  detail: ParsedViewerDetail,
): Promise<void> {
  await db
    .update(oneshots)
    .set({
      title: detail.title,
      author: detail.author,
      thumbnailUrl: detail.thumbnailUrl,
      publishedAt: detail.publishedAt,
      year: detail.year,
      detailsFetchedAt: new Date(),
    })
    .where(eq(oneshots.id, id));
}

export async function markDetailsFetchFailed(db: Db, id: number): Promise<void> {
  await db.update(oneshots).set({ detailsFetchedAt: new Date() }).where(eq(oneshots.id, id));
}

import type { Db } from "@yomikiri/db/client-node";
import { oneshots } from "@yomikiri/db/schema";
import type { ParsedOneshot } from "../parsers/types.js";

export interface UpsertSummary {
  inserted: number;
  updated: number;
}

export async function upsertOneshots(
  db: Db,
  sourceKey: string,
  items: ParsedOneshot[],
): Promise<UpsertSummary> {
  const summary: UpsertSummary = { inserted: 0, updated: 0 };

  for (const item of items) {
    const now = new Date();

    const [row] = await db
      .insert(oneshots)
      .values({
        sourceKey,
        title: item.title,
        author: item.author,
        thumbnailUrl: item.thumbnailUrl,
        viewerUrl: item.viewerUrl,
        publishedAt: item.publishedAt,
        firstSeenAt: now,
        lastSeenAt: now,
      })
      .onConflictDoUpdate({
        target: [oneshots.sourceKey, oneshots.viewerUrl],
        set: {
          title: item.title,
          author: item.author,
          thumbnailUrl: item.thumbnailUrl,
          publishedAt: item.publishedAt,
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

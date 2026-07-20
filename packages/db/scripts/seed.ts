import "dotenv/config";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { genres } from "../src/schema.js";

const GENRES = [
  { key: "battle", label: "バトル", sortOrder: 1 },
  { key: "romance", label: "恋愛", sortOrder: 2 },
  { key: "comedy", label: "コメディ・ギャグ", sortOrder: 3 },
  { key: "horror", label: "ホラー", sortOrder: 4 },
  { key: "sf", label: "SF", sortOrder: 5 },
  { key: "fantasy", label: "ファンタジー", sortOrder: 6 },
  { key: "mystery", label: "ミステリー・サスペンス", sortOrder: 7 },
  { key: "slice-of-life", label: "日常", sortOrder: 8 },
  { key: "sports", label: "スポーツ", sortOrder: 9 },
  { key: "drama", label: "ヒューマンドラマ", sortOrder: 10 },
  { key: "gourmet", label: "グルメ", sortOrder: 11 },
] as const;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("環境変数 DATABASE_URL が設定されていません");
  }

  const client = postgres(databaseUrl);
  const db = drizzle(client);

  await db
    .insert(genres)
    .values([...GENRES])
    .onConflictDoUpdate({
      target: genres.key,
      set: {
        label: sql`excluded.label`,
        sortOrder: sql`excluded.sort_order`,
      },
    });

  await client.end();

  console.log(`ジャンルマスタを ${GENRES.length} 件投入しました`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

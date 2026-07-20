import "dotenv/config";
import { fileURLToPath } from "node:url";
import { createDb } from "@yomikiri/db/client-node";
import { loadEnabledSources } from "./config/sources.js";
import { collectUrls } from "./crawler/collectUrls.js";
import { fetchDetails } from "./crawler/fetchDetails.js";
import { log } from "./logger.js";

const sourcesPath = fileURLToPath(new URL("../../../sources.json", import.meta.url));

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("環境変数 DATABASE_URL が設定されていません");
  }

  const sources = loadEnabledSources(sourcesPath);
  const db = createDb(databaseUrl);

  // 1. 各サイトの読み切り一覧ページからビューワー URL を収集してキュー（oneshots）に登録する
  const collectResults = await collectUrls(db, sources);
  log("info", "URL 収集バッチが完了しました", { results: collectResults });

  // 2. キューにある詳細未取得のビューワー URL へアクセスし、詳細を取得する
  const detailResults = await fetchDetails(db, sources);
  log("info", "詳細取得バッチが完了しました", { results: detailResults });

  const hasError =
    collectResults.some((result) => result.error !== null) ||
    detailResults.some((result) => result.error !== null);

  if (hasError) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  log("error", "バッチ実行中に予期しないエラーが発生しました", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exitCode = 1;
});

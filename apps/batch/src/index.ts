import "dotenv/config";
import { fileURLToPath } from "node:url";
import { createDb } from "@yomikiri/db/client-node";
import { loadEnabledSources } from "./config/sources.js";
import { runCrawl } from "./crawler/run.js";
import { log } from "./logger.js";

const sourcesPath = fileURLToPath(new URL("../../../sources.json", import.meta.url));

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("環境変数 DATABASE_URL が設定されていません");
  }

  const sources = loadEnabledSources(sourcesPath);
  const db = createDb(databaseUrl);

  const results = await runCrawl(db, sources);
  const hasError = results.some((result) => result.error !== null);

  log("info", "バッチ実行が完了しました", { results });

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

import "dotenv/config";
import { fileURLToPath } from "node:url";
import { createDb } from "@yomikiri/db/client-node";
import { loadEnabledSources } from "./config/sources.js";
import { collectUrls } from "./crawler/collectUrls.js";
import { deleteExpiredTransferCodes } from "./crawler/deleteExpiredTransferCodes.js";
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

  // 3. 有効期限（24時間）を過ぎたデータ引き継ぎコードを物理削除する
  const deletedTransferCodeCount = await deleteExpiredTransferCodes(db);
  log("info", "引き継ぎコード削除バッチが完了しました", { deletedCount: deletedTransferCodeCount });

  // result.error は「ソース単位で見た一時的・想定外のエラー」（robots 拒否、
  // ネットワークエラー、5xx 等）が発生した場合にのみセットされる。
  // 404/410 のような「恒久的に取得できないと分かっている個別 URL のエラー」は
  // fetchDetails 内で detailsFetchedAt を更新した上で握りつぶし、result.error には
  // 積まれない（次回以降キューに残らないため、放置しても batch は "failed" のまま
  // にはならない）。そのため、ここでの exitCode = 1 は
  // 「一覧収集自体の失敗」または「詳細取得中の一時的なエラー」のみを表す
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

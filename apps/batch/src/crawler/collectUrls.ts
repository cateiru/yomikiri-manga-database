import type { Db } from "@yomikiri/db/client-node";
import type { Source } from "../config/sources.js";
import {
  getExistingViewerUrlPaths,
  normalizeViewerUrlPath,
  upsertOneshotUrls,
} from "../db/upsert.js";
import { log } from "../logger.js";
import { assertSupportedSources, gigaviewerParser } from "../parsers/gigaviewer/index.js";
import type { ParsedOneshotUrl } from "../parsers/types.js";
import { fetchHtml, USER_AGENT } from "./fetchHtml.js";
import { fetchRobotsRules } from "./robots.js";

const REQUEST_INTERVAL_MS = 1000;

export interface SourceResult {
  sourceKey: string;
  fetched: number;
  inserted: number;
  updated: number;
  skipped: number;
  error: string | null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 各サイトの読み切り一覧ページからビューワー URL を収集し、oneshots へ登録するバッチ。
 * 詳細情報（タイトル・著者・サムネイル・掲載日）は fetchDetails 側が別途取得する。
 */
export async function collectUrls(db: Db, sources: Source[]): Promise<SourceResult[]> {
  assertSupportedSources(sources);

  const results: SourceResult[] = [];

  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    if (!source) {
      continue;
    }
    const result: SourceResult = {
      sourceKey: source.key,
      fetched: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      error: null,
    };

    try {
      const listUrls = [source.listUrl, ...(source.additionalListUrls ?? [])];
      const parsedItems: ParsedOneshotUrl[] = [];

      for (let j = 0; j < listUrls.length; j++) {
        const listUrl = listUrls[j];
        if (!listUrl) {
          continue;
        }

        const robots = await fetchRobotsRules(listUrl, USER_AGENT);
        const path = new URL(listUrl).pathname;
        if (!robots.isAllowed(path)) {
          throw new Error(`robots.txt により ${listUrl} へのアクセスが拒否されています`);
        }

        const html = await fetchHtml(listUrl);
        parsedItems.push(...gigaviewerParser.parse(html, source));

        if (j < listUrls.length - 1) {
          await sleep(REQUEST_INTERVAL_MS);
        }
      }

      result.fetched = parsedItems.length;

      const items = await filterFallbackDuplicates(db, source, parsedItems);
      result.skipped = parsedItems.length - items.length;

      if (items.length > 0) {
        const summary = await upsertOneshotUrls(db, source.key, items);
        result.inserted = summary.inserted;
        result.updated = summary.updated;
      }

      log("info", "ソースの URL 収集が完了しました", { ...result });
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      log("error", "ソースの URL 収集に失敗しました", {
        sourceKey: source.key,
        error: result.error,
      });
    }

    results.push(result);

    if (i < sources.length - 1) {
      await sleep(REQUEST_INTERVAL_MS);
    }
  }

  return results;
}

/**
 * source.fallbackSourceKey が設定されている場合、そのソースに既に登録済みの
 * viewer URL（?from= 等のクエリを除いたパスで比較）と重複する item を除外する
 */
async function filterFallbackDuplicates(
  db: Db,
  source: Source,
  items: ParsedOneshotUrl[],
): Promise<ParsedOneshotUrl[]> {
  if (!source.fallbackSourceKey) {
    return items;
  }

  const existingPaths = await getExistingViewerUrlPaths(db, source.fallbackSourceKey);
  return items.filter((item) => !existingPaths.has(normalizeViewerUrlPath(item.viewerUrl)));
}

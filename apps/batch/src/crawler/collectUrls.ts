import type { Db } from "@yomikiri/db/client-node";
import type { Source } from "../config/sources.js";
import {
  getExistingViewerUrlPaths,
  normalizeViewerUrlPath,
  upsertOneshotUrls,
} from "../db/upsert.js";
import { log } from "../logger.js";
import { assertSupportedSources, getParser } from "../parsers/index.js";
import type { CollectUrlsDeps, ParsedOneshotUrl } from "../parsers/types.js";
import { fetchHtml, USER_AGENT } from "./fetchHtml.js";
import { fetchRobotsRules, type RobotsRules } from "./robots.js";

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
      const parser = getParser(source);
      const parsedItems: ParsedOneshotUrl[] = parser.collectUrls
        ? await parser.collectUrls(source, createCollectUrlsDeps(source))
        : await collectUrlsFromListUrls(source, parser.parse);

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
 * source.listUrls を順にフェッチして parser.parse に渡す、従来どおりの収集方法。
 * parser.collectUrls を実装していないソース（gigaviewer / magapoke）で使う
 */
async function collectUrlsFromListUrls(
  source: Source,
  parse: (html: string, source: Source) => ParsedOneshotUrl[],
): Promise<ParsedOneshotUrl[]> {
  const parsedItems: ParsedOneshotUrl[] = [];

  for (let j = 0; j < source.listUrls.length; j++) {
    const listUrl = source.listUrls[j];
    if (!listUrl) {
      continue;
    }

    const robots = await fetchRobotsRules(listUrl, USER_AGENT);
    const path = new URL(listUrl).pathname;
    if (!robots.isAllowed(path)) {
      throw new Error(`robots.txt により ${listUrl} へのアクセスが拒否されています`);
    }

    const html = await fetchHtml(listUrl);
    parsedItems.push(...parse(html, source));

    if (j < source.listUrls.length - 1) {
      await sleep(REQUEST_INTERVAL_MS);
    }
  }

  return parsedItems;
}

/**
 * parser.collectUrls に渡す依存関数を組み立てる。robots.txt は source.siteUrl
 * を基準に一度だけ取得してキャッシュし、リクエスト間隔（1 req/sec）は直近アクセス
 * 時刻から算出することで、収集する URL 数によらずソース単位でマナーを守る
 */
function createCollectUrlsDeps(source: Source): CollectUrlsDeps {
  let robots: RobotsRules | null = null;
  let lastAccess: number | null = null;

  return {
    async fetchAllowedHtml(url: string): Promise<string> {
      if (!robots) {
        robots = await fetchRobotsRules(source.siteUrl, USER_AGENT);
      }
      const path = new URL(url).pathname;
      if (!robots.isAllowed(path)) {
        throw new Error(`robots.txt により ${url} へのアクセスが拒否されています`);
      }

      if (lastAccess !== null) {
        const elapsed = Date.now() - lastAccess;
        if (elapsed < REQUEST_INTERVAL_MS) {
          await sleep(REQUEST_INTERVAL_MS - elapsed);
        }
      }

      const html = await fetchHtml(url);
      lastAccess = Date.now();
      return html;
    },
  };
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

import type { Db } from "@yomikiri/db/client-node";
import type { Source } from "../config/sources.js";
import { upsertOneshots } from "../db/upsert.js";
import { log } from "../logger.js";
import { assertSupportedSources, gigaviewerParser } from "../parsers/gigaviewer/index.js";
import { fetchHtml, USER_AGENT } from "./fetchHtml.js";
import { fetchRobotsRules } from "./robots.js";

const REQUEST_INTERVAL_MS = 1000;

export interface SourceResult {
  sourceKey: string;
  fetched: number;
  inserted: number;
  updated: number;
  error: string | null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runCrawl(db: Db, sources: Source[]): Promise<SourceResult[]> {
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
      error: null,
    };

    try {
      const robots = await fetchRobotsRules(source.listUrl, USER_AGENT);
      const path = new URL(source.listUrl).pathname;
      if (!robots.isAllowed(path)) {
        throw new Error(`robots.txt により ${source.listUrl} へのアクセスが拒否されています`);
      }

      const html = await fetchHtml(source.listUrl);
      const items = gigaviewerParser.parse(html, source);
      result.fetched = items.length;

      if (items.length > 0) {
        const summary = await upsertOneshots(db, source.key, items);
        result.inserted = summary.inserted;
        result.updated = summary.updated;
      }

      log("info", "ソースの取得が完了しました", { ...result });
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      log("error", "ソースの取得に失敗しました", { sourceKey: source.key, error: result.error });
    }

    results.push(result);

    if (i < sources.length - 1) {
      await sleep(REQUEST_INTERVAL_MS);
    }
  }

  return results;
}

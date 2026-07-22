import type { Db } from "@yomikiri/db/client-node";
import * as cheerio from "cheerio";
import type { Source } from "../config/sources.js";
import {
  type DetailsQueueItem,
  getUnfetchedOneshots,
  markDetailsFetchFailed,
  updateOneshotDetail,
} from "../db/upsert.js";
import { log } from "../logger.js";
import { extractViewerDetail } from "../parsers/gigaviewer/viewerDetail.js";
import { fetchHtml, HttpError, USER_AGENT } from "./fetchHtml.js";
import { fetchRobotsRules, type RobotsRules } from "./robots.js";

const REQUEST_INTERVAL_MS = 1000;

/**
 * ビューワーページが恒久的に取得不能であることを示す HTTP ステータス。
 * リトライしても解決しないため、404/410 の場合はタイトル抽出失敗時と同様に
 * detailsFetchedAt を更新して無限リトライを防ぐ
 */
function isPermanentHttpError(status: number): boolean {
  return status === 404 || status === 410;
}

export interface SourceDetailResult {
  sourceKey: string;
  attempted: number;
  fetched: number;
  failed: number;
  error: string | null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function groupBySource(items: DetailsQueueItem[]): Map<string, DetailsQueueItem[]> {
  const grouped = new Map<string, DetailsQueueItem[]>();
  for (const item of items) {
    const list = grouped.get(item.sourceKey) ?? [];
    list.push(item);
    grouped.set(item.sourceKey, list);
  }
  return grouped;
}

/**
 * 詳細未取得（detailsFetchedAt IS NULL）のビューワー URL へアクセスし、
 * タイトル・著者・サムネイル・掲載日を取得して oneshots を更新するバッチ。
 *
 * source ごとの滞留件数に偏りがあっても他 source の処理が後回しにならないよう、
 * source ごとのキューからラウンドロビンで 1 件ずつ取り出して処理する。
 * レート制限（source ごと 1 req/sec 以内）は source ごとの直近アクセス時刻で管理する。
 */
export async function fetchDetails(db: Db, sources: Source[]): Promise<SourceDetailResult[]> {
  const sourceByKey = new Map(sources.map((source) => [source.key, source]));
  const queue = await getUnfetchedOneshots(db);
  // sources.json から無効化・削除された source の行は対象外とする
  const targetQueue = queue.filter((item) => sourceByKey.has(item.sourceKey));
  const queueBySource = groupBySource(targetQueue);

  const results = new Map<string, SourceDetailResult>();
  for (const sourceKey of queueBySource.keys()) {
    results.set(sourceKey, { sourceKey, attempted: 0, fetched: 0, failed: 0, error: null });
  }

  const robotsBySource = new Map<string, RobotsRules>();
  const lastAccessBySource = new Map<string, number>();
  const sourceKeys = [...queueBySource.keys()];

  let remaining = targetQueue.length;
  let cursor = 0;

  while (remaining > 0) {
    const sourceKey = sourceKeys[cursor % sourceKeys.length];
    cursor += 1;
    if (sourceKey === undefined) {
      break;
    }

    const item = queueBySource.get(sourceKey)?.shift();
    if (!item) {
      continue;
    }
    remaining -= 1;

    const source = sourceByKey.get(sourceKey);
    const result = results.get(sourceKey);
    if (!source || !result) {
      continue;
    }
    result.attempted += 1;

    try {
      let robots = robotsBySource.get(sourceKey);
      if (!robots) {
        robots = await fetchRobotsRules(source.siteUrl, USER_AGENT);
        robotsBySource.set(sourceKey, robots);
      }
      const path = new URL(item.viewerUrl).pathname;
      if (!robots.isAllowed(path)) {
        throw new Error(`robots.txt により ${item.viewerUrl} へのアクセスが拒否されています`);
      }

      const lastAccess = lastAccessBySource.get(sourceKey);
      if (lastAccess !== undefined) {
        const elapsed = Date.now() - lastAccess;
        if (elapsed < REQUEST_INTERVAL_MS) {
          await sleep(REQUEST_INTERVAL_MS - elapsed);
        }
      }

      const html = await fetchHtml(item.viewerUrl);
      lastAccessBySource.set(sourceKey, Date.now());

      const detail = extractViewerDetail(cheerio.load(html), item.viewerUrl);
      if (detail) {
        await updateOneshotDetail(db, item.id, detail);
        result.fetched += 1;
        log("info", "詳細を取得しました", {
          sourceKey,
          viewerUrl: item.viewerUrl,
          title: detail.title,
          remaining,
        });
      } else {
        // HTML は取得できたがパースに失敗した場合は取得試行済みとして記録し、
        // 無限リトライを防ぐ（表示対象からは title IS NULL のまま除外される）
        await markDetailsFetchFailed(db, item.id);
        result.failed += 1;
        log("warn", "ビューワーページから詳細を抽出できませんでした", {
          sourceKey,
          viewerUrl: item.viewerUrl,
        });
      }
    } catch (error) {
      if (error instanceof HttpError && isPermanentHttpError(error.status)) {
        // 404/410 はページが恒久的に消滅したことを意味し、リトライしても解決しないため、
        // タイトル抽出失敗時と同様に取得試行済みとして記録し無限リトライを防ぐ。
        // これは「想定内・処理済みのエラー」であり、result.error には積まない
        // （バッチ全体の exitCode には影響させない。apps/batch/src/index.ts 参照）
        await markDetailsFetchFailed(db, item.id);
        result.failed += 1;
        log(
          "warn",
          "ビューワーページが見つかりませんでした（404/410）。リトライ対象から除外します",
          {
            sourceKey,
            viewerUrl: item.viewerUrl,
            status: error.status,
          },
        );
        continue;
      }

      // 上記以外（ネットワークエラー・5xx・robots 拒否等）は一時的なエラーとみなし、
      // detailsFetchedAt を更新せず次回バッチでのリトライ対象として残す
      result.error = error instanceof Error ? error.message : String(error);
      log("error", "詳細取得に失敗しました", {
        sourceKey,
        viewerUrl: item.viewerUrl,
        error: result.error,
      });
    }
  }

  const resultList = [...results.values()];
  for (const result of resultList) {
    log("info", "ソースの詳細取得が完了しました", { ...result });
  }

  return resultList;
}

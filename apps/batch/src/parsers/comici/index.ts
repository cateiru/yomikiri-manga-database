import * as cheerio from "cheerio";
import type { Source } from "../../config/sources.js";
import { log } from "../../logger.js";
import { buildUrlItem, toAbsoluteUrl } from "../shared.js";
import type { CollectUrlsDeps, ParsedOneshotUrl, Parser } from "../types.js";

/**
 * 読み切りカテゴリ一覧ページ（1 ページ分）から作品のシリーズページ URL を抽出する。
 * comici はカテゴリ一覧 → シリーズページ → 話一覧という 2 段構成のため、
 * ここで得られる URL はビューワー（/episodes/...）ではなくシリーズ（/series/...）
 */
function extractSeriesUrls($: cheerio.CheerioAPI, source: Source): ParsedOneshotUrl[] {
  const items: ParsedOneshotUrl[] = [];

  $('div[data-e2e="pageCategory"] a[data-e2e="sliLnk"]').each((_, el) => {
    const item = buildUrlItem({ source, viewerUrlRaw: $(el).attr("href") });
    if (item) {
      items.push(item);
    }
  });

  return items;
}

/**
 * ページネーションの「次のページへ」リンクから次ページの URL を返す。
 * 最終ページではこのリンク自体が存在しないため null を返す
 */
function findNextPageUrl($: cheerio.CheerioAPI, currentUrl: string): string | null {
  const href = $('a[data-e2e="pgLnkNext"]').first().attr("href");
  return toAbsoluteUrl(href, currentUrl);
}

/**
 * 読み切りカテゴリ一覧を、ページネーションを辿りながらシリーズページ URL を収集する。
 * URL を訪問済み集合で管理し、次ページの指す先が誤って循環した場合の
 * 無限ループを防ぐ
 */
async function collectSeriesUrls(source: Source, deps: CollectUrlsDeps): Promise<string[]> {
  const seriesUrls = new Set<string>();
  const visitedPages = new Set<string>();

  let url: string | null = new URL("/category/manga/oneShot/1", source.siteUrl).toString();

  while (url && !visitedPages.has(url)) {
    visitedPages.add(url);

    const html = await deps.fetchAllowedHtml(url);
    const $ = cheerio.load(html);
    for (const item of extractSeriesUrls($, source)) {
      seriesUrls.add(item.viewerUrl);
    }
    url = findNextPageUrl($, url);
  }

  return [...seriesUrls];
}

/**
 * シリーズページから最初の話（第1話）のビューワー URL を抽出する。
 * 読み切りは基本 1 話のみだが、後日続編が追加されて複数話になる場合もあるため、
 * 常に DOM 順で先頭（＝第1話）を採用する
 */
function extractFirstEpisodeUrl($: cheerio.CheerioAPI, source: Source): ParsedOneshotUrl | null {
  const href = $('a[data-e2e="eliLnk"]').first().attr("href");
  return buildUrlItem({ source, viewerUrlRaw: href });
}

async function collectUrls(source: Source, deps: CollectUrlsDeps): Promise<ParsedOneshotUrl[]> {
  const seriesUrls = await collectSeriesUrls(source, deps);

  const items: ParsedOneshotUrl[] = [];

  for (const seriesUrl of seriesUrls) {
    try {
      const html = await deps.fetchAllowedHtml(seriesUrl);
      const item = extractFirstEpisodeUrl(cheerio.load(html), source);

      if (item) {
        items.push(item);
      } else {
        log("warn", "シリーズページから話のビューワー URL を抽出できませんでした", {
          sourceKey: source.key,
          seriesUrl,
        });
      }
    } catch (error) {
      // 1 シリーズの失敗が他シリーズの収集を止めないよう、ログのみ残して続行する
      log("warn", "シリーズページの取得に失敗しました", {
        sourceKey: source.key,
        seriesUrl,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return items;
}

export const comiciParser: Parser = {
  parse(html, source) {
    // カテゴリ一覧ページ単体の同期抽出（シリーズページ URL を返す）。
    // 実際のビューワー URL 解決にはシリーズページへの追加フェッチが必要なため、
    // 本番の収集経路では代わりに collectUrls を使う
    return extractSeriesUrls(cheerio.load(html), source);
  },
  collectUrls,
};

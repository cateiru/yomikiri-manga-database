import * as cheerio from "cheerio";
import type { Source } from "../../config/sources.js";
import { log } from "../../logger.js";
import { buildUrlItem } from "../shared.js";
import type { CollectUrlsDeps, ParsedOneshotUrl, Parser } from "../types.js";
import { extractChapters } from "./chapters.js";

const TITLE_URL_PATTERN = /^\/title\/\d+$/;

/**
 * 一覧ページ（作品カード）から作品ページ URL を抽出する。ここで得られる URL は
 * ビューワー（/chapter/...）ではなく作品ページ（/title/...）で、実際のビューワー
 * URL 解決には作品ページへの追加フェッチが必要（collectUrls 参照）
 */
function extractTitleUrls($: cheerio.CheerioAPI, source: Source): ParsedOneshotUrl[] {
  const items: ParsedOneshotUrl[] = [];
  const seen = new Set<string>();

  $('a[href^="/title/"]').each((_, el) => {
    const href = $(el).attr("href");
    if (!href || !TITLE_URL_PATTERN.test(href)) {
      return;
    }
    const item = buildUrlItem({ source, viewerUrlRaw: href });
    if (item && !seen.has(item.viewerUrl)) {
      seen.add(item.viewerUrl);
      items.push(item);
    }
  });

  return items;
}

/**
 * 作品ページから最初の話（第1話、priority が最小の話）のビューワー URL を抽出する。
 * 読み切りは基本 1 話のみだが、同日に複数パートへ分割される場合もあるため、
 * 常に priority が最小（＝最初のパート）を採用する
 */
function extractFirstChapterUrl(html: string, source: Source): ParsedOneshotUrl | null {
  const chapters = extractChapters(html);
  if (chapters.length === 0) {
    return null;
  }

  const firstChapter = chapters.reduce((first, chapter) =>
    chapter.priority < first.priority ? chapter : first,
  );

  return buildUrlItem({ source, viewerUrlRaw: `/chapter/${firstChapter.id}` });
}

async function collectUrls(source: Source, deps: CollectUrlsDeps): Promise<ParsedOneshotUrl[]> {
  const titleUrls = new Set<string>();
  for (const listUrl of source.listUrls) {
    const html = await deps.fetchAllowedHtml(listUrl);
    for (const item of extractTitleUrls(cheerio.load(html), source)) {
      titleUrls.add(item.viewerUrl);
    }
  }

  const items: ParsedOneshotUrl[] = [];

  for (const titleUrl of titleUrls) {
    try {
      const html = await deps.fetchAllowedHtml(titleUrl);
      const item = extractFirstChapterUrl(html, source);

      if (item) {
        items.push(item);
      } else {
        log("warn", "作品ページから話のビューワー URL を抽出できませんでした", {
          sourceKey: source.key,
          titleUrl,
        });
      }
    } catch (error) {
      // 1 作品の失敗が他作品の収集を止めないよう、ログのみ残して続行する
      log("warn", "作品ページの取得に失敗しました", {
        sourceKey: source.key,
        titleUrl,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return items;
}

export const flowercomicsParser: Parser = {
  parse(html, source) {
    // 一覧ページ単体の同期抽出（作品ページ URL を返す）。実際のビューワー URL
    // 解決には作品ページへの追加フェッチが必要なため、本番の収集経路では
    // 代わりに collectUrls を使う
    return extractTitleUrls(cheerio.load(html), source);
  },
  collectUrls,
};

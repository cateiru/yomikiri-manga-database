import * as cheerio from "cheerio";
import type { Source } from "../../config/sources.js";
import { log } from "../../logger.js";
import { buildUrlItem } from "../shared.js";
import type { CollectUrlsDeps, ParsedOneshotUrl, Parser } from "../types.js";

/**
 * ジャンル一覧ページ（1 ページ分）から作品ページ URL を抽出する。
 * マンガUP! はジャンル一覧 → 作品ページ → 話一覧という 2 段構成のため、
 * ここで得られる URL はビューワー（/titles/{id}/chapters/{chapterId}）ではなく
 * 作品ページ（/titles/{id}）
 */
function extractTitleUrls($: cheerio.CheerioAPI, source: Source): ParsedOneshotUrl[] {
  const items: ParsedOneshotUrl[] = [];
  const seen = new Set<string>();

  for (const el of $('a[href^="https://www.manga-up.com/titles/"]')) {
    const item = buildUrlItem({ source, viewerUrlRaw: $(el).attr("href") });
    if (item && !seen.has(item.viewerUrl)) {
      seen.add(item.viewerUrl);
      items.push(item);
    }
  }

  return items;
}

/**
 * 作品ページから最初の話のビューワー URL を抽出する。読み切りが前編・中編・後編等の
 * 複数話に分割される場合があるため、常に DOM 順で先頭（＝最初の話）を採用する。
 * 話一覧の各リンクは class="w-full" を持つが、ページ上部の「次の話を読む」導線は
 * 同じ /chapters/ へのリンクでもこの class を持たないため区別できる
 */
function extractFirstChapterUrl($: cheerio.CheerioAPI, source: Source): ParsedOneshotUrl | null {
  const href = $('a.w-full[href*="/chapters/"]').first().attr("href");
  return buildUrlItem({ source, viewerUrlRaw: href });
}

async function collectTitleUrls(source: Source, deps: CollectUrlsDeps): Promise<string[]> {
  const titleUrls = new Set<string>();

  for (const listUrl of source.listUrls) {
    const html = await deps.fetchAllowedHtml(listUrl);
    for (const item of extractTitleUrls(cheerio.load(html), source)) {
      titleUrls.add(item.viewerUrl);
    }
  }

  return [...titleUrls];
}

async function collectUrls(source: Source, deps: CollectUrlsDeps): Promise<ParsedOneshotUrl[]> {
  const titleUrls = await collectTitleUrls(source, deps);

  const items: ParsedOneshotUrl[] = [];

  for (const titleUrl of titleUrls) {
    try {
      const html = await deps.fetchAllowedHtml(titleUrl);
      const item = extractFirstChapterUrl(cheerio.load(html), source);

      if (item) {
        items.push(item);
      } else {
        log("warn", "作品ページから話のビューワー URL を抽出できませんでした", {
          sourceKey: source.key,
          titleUrl,
        });
      }
    } catch (error) {
      // 1 作品の取得失敗が他作品の収集を止めないよう、ログのみ残して続行する
      log("warn", "作品ページの取得に失敗しました", {
        sourceKey: source.key,
        titleUrl,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return items;
}

export const mangaUpParser: Parser = {
  parse(html, source) {
    // ジャンル一覧ページ単体の同期抽出（作品ページ URL を返す）。
    // 実際のビューワー URL 解決には作品ページへの追加フェッチが必要なため、
    // 本番の収集経路では代わりに collectUrls を使う
    return extractTitleUrls(cheerio.load(html), source);
  },
  collectUrls,
};

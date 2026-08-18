import * as cheerio from "cheerio";
import type { Source } from "../../config/sources.js";
import { buildUrlItem } from "../shared.js";
import type { CollectUrlsDeps, ParsedOneshotUrl, Parser } from "../types.js";

// タグ一覧ページ（読切タグ ID=17）はクライアントサイド JS が独自バイナリ形式の
// 内部 API から作品一覧を取得する Next.js SPA のため、収集には headless
// Chromium による描画後 DOM の取得が必要（manga-one と同様）。ページ内には
// 「話読み」（無料 web 読み）と「単行本」（購入対象）のタブがあり、パラメータ
// なしでは前者が既定表示される
const LIST_ITEM_SELECTOR = 'a[href^="/manga/"]';
const ONESHOT_LINK_PATTERN = /^\/manga\/\d+$/;

async function collectUrls(source: Source, deps: CollectUrlsDeps): Promise<ParsedOneshotUrl[]> {
  if (!deps.fetchAllowedRenderedHtml) {
    throw new Error("comic-fuz の収集には fetchAllowedRenderedHtml が必要です");
  }

  const listUrl = source.listUrls[0];
  if (!listUrl) {
    throw new Error("comic-fuz の収集には listUrls が必要です");
  }

  const html = await deps.fetchAllowedRenderedHtml(listUrl, LIST_ITEM_SELECTOR);
  const $ = cheerio.load(html);

  const seen = new Set<string>();
  const items: ParsedOneshotUrl[] = [];
  for (const el of $(LIST_ITEM_SELECTOR)) {
    const href = $(el).attr("href");
    if (!href || !ONESHOT_LINK_PATTERN.test(href)) {
      continue;
    }

    const item = buildUrlItem({ source, viewerUrlRaw: href });
    if (item && !seen.has(item.viewerUrl)) {
      seen.add(item.viewerUrl);
      items.push(item);
    }
  }

  return items;
}

export const comicFuzParser: Parser = {
  parse(): ParsedOneshotUrl[] {
    // COMIC FUZ は静的な一覧 HTML から作品を抽出できないため collectUrls を使う
    throw new Error("comic-fuz は parse() 未対応です（collectUrls を使用してください）");
  },
  collectUrls,
};

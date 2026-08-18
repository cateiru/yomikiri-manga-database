import * as cheerio from "cheerio";
import type { Source } from "../../config/sources.js";
import { buildUrlItem } from "../shared.js";
import type { ParsedOneshotUrl, Parser } from "../types.js";

function extract($: cheerio.CheerioAPI, source: Source): ParsedOneshotUrl[] {
  const items: ParsedOneshotUrl[] = [];

  $(".comic-list-wrapper .book-list-item").each((_, el) => {
    // サムネイルリンク（/content/{id}）を viewer URL として採用する。実際の閲覧
    // ページ（/product/{id}）は PUBLUS Reader へリダイレクトする署名付き URL で
    // 静的 HTML から詳細を取得できないため使わない
    const link = $(el).find("a.book-list-item-thum-wrapper").first();

    const item = buildUrlItem({ source, viewerUrlRaw: link.attr("href") });

    if (item) {
      items.push(item);
    }
  });

  return items;
}

export const comicBoostParser: Parser = {
  parse(html, source) {
    return extract(cheerio.load(html), source);
  },
};

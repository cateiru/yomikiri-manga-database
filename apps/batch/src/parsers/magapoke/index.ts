import * as cheerio from "cheerio";
import type { Source } from "../../config/sources.js";
import { buildUrlItem } from "../shared.js";
import type { ParsedOneshotUrl, Parser } from "../types.js";

function extract($: cheerio.CheerioAPI, source: Source): ParsedOneshotUrl[] {
  const items: ParsedOneshotUrl[] = [];

  $("li.c-search-items__item").each((_, el) => {
    const li = $(el);
    // 「はじめから読む」リンクを viewer URL として採用する（「最新話を読む」は
    // 複数話にまたがる作品では別エピソードを指すため使わない）
    const link = li.find("a.c-search-item__button--start").first();

    const item = buildUrlItem({ source, viewerUrlRaw: link.attr("href") });

    if (item) {
      items.push(item);
    }
  });

  return items;
}

export const magapokeParser: Parser = {
  parse(html, source) {
    return extract(cheerio.load(html), source);
  },
};

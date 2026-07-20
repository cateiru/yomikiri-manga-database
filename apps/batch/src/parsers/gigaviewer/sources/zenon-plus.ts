import type { CheerioAPI } from "cheerio";
import type { Source } from "../../../config/sources.js";
import type { ParsedOneshot } from "../../types.js";
import { buildItem, cleanText } from "../common.js";

export function extract($: CheerioAPI, source: Source): ParsedOneshot[] {
  const items: ParsedOneshot[] = [];

  $("div.series-item").each((_, el) => {
    const item_ = $(el);
    const link = item_.find(".item-series-title a").first();

    const item = buildItem({
      source,
      title: cleanText(link.text()),
      author: cleanText(item_.find(".item-series-author").text()),
      thumbnailUrl: item_.find("img").attr("data-src") ?? null,
      viewerUrlRaw: link.attr("href"),
      publishedAt: null,
    });

    if (item) {
      items.push(item);
    }
  });

  return items;
}

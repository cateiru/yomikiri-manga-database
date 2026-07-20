import type { CheerioAPI } from "cheerio";
import type { Source } from "../../../config/sources.js";
import type { ParsedOneshot } from "../../types.js";
import { buildItem, cleanText } from "../common.js";

export function extract($: CheerioAPI, source: Source): ParsedOneshot[] {
  const items: ParsedOneshot[] = [];

  $("ul.series-list li.series-list-item").each((_, el) => {
    const li = $(el);
    const link = li.find("> a").first();
    const img = li.find("img").first();

    const item = buildItem({
      source,
      title: cleanText(li.find(".series-list-title").text()),
      author: cleanText(li.find(".series-list-author").text()),
      thumbnailUrl: img.attr("data-src") ?? img.attr("src") ?? null,
      viewerUrlRaw: link.attr("href"),
      publishedAt: null,
    });

    if (item) {
      items.push(item);
    }
  });

  return items;
}

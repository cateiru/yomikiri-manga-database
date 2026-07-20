import type { CheerioAPI } from "cheerio";
import type { Source } from "../../../config/sources.js";
import type { ParsedOneshot } from "../../types.js";
import { buildItem, cleanText } from "../common.js";

export function extract($: CheerioAPI, source: Source): ParsedOneshot[] {
  const items: ParsedOneshot[] = [];

  $("section.oneshot-wrapper li.page-series-list-item").each((_, el) => {
    const li = $(el);
    const link = li.find("a.series-thumb").first();

    const item = buildItem({
      source,
      title: cleanText(li.find("h4").first().text()),
      author: cleanText(li.find("h5").first().text()),
      thumbnailUrl: li.find("img").attr("data-src") ?? null,
      viewerUrlRaw: link.attr("href"),
      publishedAt: null,
    });

    if (item) {
      items.push(item);
    }
  });

  return items;
}

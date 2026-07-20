import type { CheerioAPI } from "cheerio";
import type { Source } from "../../../config/sources.js";
import type { ParsedOneshot } from "../../types.js";
import { buildItem, cleanText } from "../common.js";

export function extract($: CheerioAPI, source: Source): ParsedOneshot[] {
  const items: ParsedOneshot[] = [];
  const container = $("section.test-oneshot-series-list-section");

  container.find("a.series-item-container").each((_, el) => {
    const link = $(el);

    const item = buildItem({
      source,
      title: cleanText(link.find(".series-title").text()),
      author: cleanText(link.find(".author").text()),
      thumbnailUrl: link.find("img").attr("data-src") ?? null,
      viewerUrlRaw: link.attr("href"),
      publishedAt: null,
    });

    if (item) {
      items.push(item);
    }
  });

  return items;
}

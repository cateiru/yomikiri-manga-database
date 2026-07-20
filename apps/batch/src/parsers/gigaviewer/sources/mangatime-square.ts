import type { CheerioAPI } from "cheerio";
import type { Source } from "../../../config/sources.js";
import type { ParsedOneshot } from "../../types.js";
import { buildItem, cleanText } from "../common.js";

export function extract($: CheerioAPI, source: Source): ParsedOneshot[] {
  const items: ParsedOneshot[] = [];
  const container = $("section#extra");

  container.find("div[class*='SeriesPageSeriesItem_content']").each((_, el) => {
    const content = $(el);
    const link = content.find("a[data-series-title]").first();

    const item = buildItem({
      source,
      title:
        link.attr("data-series-title") ??
        cleanText(content.find("[class*='SeriesPageSeriesItem_title']").text()),
      author: cleanText(content.find("[class*='SeriesPageSeriesItem_author']").text()),
      thumbnailUrl: content.find("img").attr("src") ?? null,
      viewerUrlRaw: link.attr("href"),
      publishedAt: null,
    });

    if (item) {
      items.push(item);
    }
  });

  return items;
}

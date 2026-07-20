import type { CheerioAPI } from "cheerio";
import type { Source } from "../../../config/sources.js";
import type { ParsedOneshot } from "../../types.js";
import { buildItem, cleanText } from "../common.js";

export function extract($: CheerioAPI, source: Source): ParsedOneshot[] {
  const items: ParsedOneshot[] = [];
  const container = $("section[class*='OneshotPage_pageSeriesSection']");

  container.find("li[class*='SeriesPageItem_item']").each((_, el) => {
    const li = $(el);
    const link = li.find("a[data-series-name]").first();

    const item = buildItem({
      source,
      title:
        link.attr("data-series-name") ??
        cleanText(li.find("[class*='SeriesPageItem_title']").text()),
      author: cleanText(li.find("[class*='SeriesPageItem_author']").text()),
      thumbnailUrl: li.find("img").attr("src") ?? null,
      viewerUrlRaw: link.attr("href"),
      publishedAt: null,
    });

    if (item) {
      items.push(item);
    }
  });

  return items;
}

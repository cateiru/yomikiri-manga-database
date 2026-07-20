import type { CheerioAPI } from "cheerio";
import type { Source } from "../../../config/sources.js";
import type { ParsedOneshot } from "../../types.js";
import { buildItem, cleanText } from "../common.js";

export function extract($: CheerioAPI, source: Source): ParsedOneshot[] {
  const items: ParsedOneshot[] = [];
  const container = $("ul[class*='SeriesList_series_list']");

  container.find("li").each((_, el) => {
    const li = $(el);
    const link = li.find("a[class*='SeriesListItem_link']").first();

    const item = buildItem({
      source,
      title: cleanText(li.find("[class*='SeriesListItem_title']").text()),
      author: cleanText(li.find("[class*='SeriesListItem_author']").text()),
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

import type { CheerioAPI } from "cheerio";
import type { Source } from "../../../config/sources.js";
import type { ParsedOneshot } from "../../types.js";
import { buildItem, cleanText } from "../common.js";

export function extract($: CheerioAPI, source: Source): ParsedOneshot[] {
  const items: ParsedOneshot[] = [];
  const container = $("section#oneshot");

  container.find("li[class*='SeriesListItem_item']").each((_, el) => {
    const li = $(el);
    const link = li.find("a[class*='SeriesListItem_thumb_link']").first();

    const item = buildItem({
      source,
      title: cleanText(li.find("[class*='SeriesListItem_title']").text()),
      author: cleanText(li.find("[class*='SeriesListItem_author']").text()),
      thumbnailUrl: li.find("img[class*='SeriesListItem_thumb__']").attr("src") ?? null,
      viewerUrlRaw: link.attr("href"),
      publishedAt: null,
    });

    if (item) {
      items.push(item);
    }
  });

  return items;
}

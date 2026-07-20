import type { CheerioAPI } from "cheerio";
import type { Source } from "../../../config/sources.js";
import type { ParsedOneshot } from "../../types.js";
import { buildItem, cleanText } from "../common.js";

export function extract($: CheerioAPI, source: Source): ParsedOneshot[] {
  const items: ParsedOneshot[] = [];
  const container = $("h2#oneshot").next("div[class*='SeriesPage_series_list']");

  container.find("div[class*='Series_series__']").each((_, el) => {
    const item_ = $(el);
    const link = item_.find("a[data-series-name]").first();
    const titleEl = item_.find("[class*='Series_title']").first();
    const authorEl = item_.find("[class*='Series_author']").first();

    const item = buildItem({
      source,
      title: link.attr("data-series-name") ?? titleEl.attr("title") ?? cleanText(titleEl.text()),
      author: authorEl.attr("title") ?? cleanText(authorEl.text()),
      thumbnailUrl: item_.find("img").attr("src") ?? null,
      viewerUrlRaw: link.attr("href"),
      publishedAt: null,
    });

    if (item) {
      items.push(item);
    }
  });

  return items;
}

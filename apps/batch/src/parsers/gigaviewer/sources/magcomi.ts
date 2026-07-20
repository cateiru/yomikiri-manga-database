import { type CheerioAPI, load } from "cheerio";
import type { Source } from "../../../config/sources.js";
import type { ParsedOneshot } from "../../types.js";
import { buildItem, cleanText } from "../common.js";

export function extract($: CheerioAPI, source: Source): ParsedOneshot[] {
  const items: ParsedOneshot[] = [];
  const container = $("h2#oneshot").next("ul");

  container.find("li[class*='SeriesItem_series_item']").each((_, el) => {
    const li = $(el);
    const link = li.find("a[data-series-name]").first();

    const noscript = li.find("noscript").first();
    const thumbnailUrl =
      noscript.length > 0 ? (load(noscript.html() ?? "")("img").attr("src") ?? null) : null;

    const item = buildItem({
      source,
      title:
        link.attr("data-series-name") ??
        cleanText(li.find("[class*='SeriesItem_series_title']").text()),
      author: cleanText(li.find("[class*='SeriesItem_author']").text()),
      thumbnailUrl,
      viewerUrlRaw: link.attr("href"),
      publishedAt: null,
    });

    if (item) {
      items.push(item);
    }
  });

  return items;
}

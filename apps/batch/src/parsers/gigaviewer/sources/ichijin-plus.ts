import type { CheerioAPI } from "cheerio";
import type { Source } from "../../../config/sources.js";
import type { ParsedOneshotUrl } from "../../types.js";
import { buildUrlItem } from "../common.js";

export function extract($: CheerioAPI, source: Source): ParsedOneshotUrl[] {
  const items: ParsedOneshotUrl[] = [];
  const container = $("h2#oneshot").next("div[class*='SeriesPage_series_list']");

  container.find("div[class*='Series_series__']").each((_, el) => {
    const item_ = $(el);
    const link = item_.find("a[data-series-name]").first();

    const item = buildUrlItem({ source, viewerUrlRaw: link.attr("href") });

    if (item) {
      items.push(item);
    }
  });

  return items;
}

import type { CheerioAPI } from "cheerio";
import type { Source } from "../../../config/sources.js";
import type { ParsedOneshotUrl } from "../../types.js";
import { buildUrlItem } from "../common.js";

export function extract($: CheerioAPI, source: Source): ParsedOneshotUrl[] {
  const items: ParsedOneshotUrl[] = [];
  const container = $("section#extra");

  container.find("div[class*='SeriesPageSeriesItem_content']").each((_, el) => {
    const content = $(el);
    const link = content.find("a[data-series-title]").first();

    const item = buildUrlItem({ source, viewerUrlRaw: link.attr("href") });

    if (item) {
      items.push(item);
    }
  });

  return items;
}

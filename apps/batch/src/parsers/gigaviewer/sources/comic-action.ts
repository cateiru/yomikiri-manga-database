import type { CheerioAPI } from "cheerio";
import type { Source } from "../../../config/sources.js";
import type { ParsedOneshotUrl } from "../../types.js";
import { buildUrlItem } from "../common.js";

export function extract($: CheerioAPI, source: Source): ParsedOneshotUrl[] {
  const items: ParsedOneshotUrl[] = [];
  const container = $("section#oneshot");

  container.find("li[class*='SeriesListItem_item']").each((_, el) => {
    const li = $(el);
    const link = li.find("a[class*='SeriesListItem_thumb_link']").first();

    const item = buildUrlItem({ source, viewerUrlRaw: link.attr("href") });

    if (item) {
      items.push(item);
    }
  });

  return items;
}

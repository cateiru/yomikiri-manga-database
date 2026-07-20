import type { CheerioAPI } from "cheerio";
import type { Source } from "../../../config/sources.js";
import type { ParsedOneshotUrl } from "../../types.js";
import { buildUrlItem } from "../common.js";

export function extract($: CheerioAPI, source: Source): ParsedOneshotUrl[] {
  const items: ParsedOneshotUrl[] = [];
  const container = $("section[class*='SeriesSection_series_list_section']");

  container.find("li[class*='Series_episode_item']").each((_, el) => {
    const li = $(el);
    const link = li.find("a").first();

    const item = buildUrlItem({ source, viewerUrlRaw: link.attr("href") });

    if (item) {
      items.push(item);
    }
  });

  return items;
}

import type { CheerioAPI } from "cheerio";
import type { Source } from "../../../config/sources.js";
import type { ParsedOneshot } from "../../types.js";
import { buildItem, cleanText } from "../common.js";

export function extract($: CheerioAPI, source: Source): ParsedOneshot[] {
  const items: ParsedOneshot[] = [];
  const container = $("div.oneshot-container");

  container.find("li.webry-series-item").each((_, el) => {
    const li = $(el);
    const link = li.find("a.webry-series-item-link").first();

    const item = buildItem({
      source,
      title: cleanText(li.find(".series-title").first().text()),
      author: cleanText(li.find(".author").text()),
      thumbnailUrl: li.find("img").attr("data-src") ?? null,
      viewerUrlRaw: link.attr("href"),
      publishedAt: null,
    });

    if (item) {
      items.push(item);
    }
  });

  return items;
}

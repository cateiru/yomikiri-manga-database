import type { CheerioAPI } from "cheerio";
import type { Source } from "../../../config/sources.js";
import type { ParsedOneshot } from "../../types.js";
import { buildItem, cleanText, parseJapaneseDate } from "../common.js";

export function extract($: CheerioAPI, source: Source): ParsedOneshot[] {
  const items: ParsedOneshot[] = [];

  $("ul.yomikiri-items li.yomikiri-item-box").each((_, el) => {
    const li = $(el);
    const link = li.find("a.yomikiri-link").first();

    const item = buildItem({
      source,
      title: cleanText(li.find(".yomikiri-link-title h4").text()),
      author: cleanText(li.find(".yomikiri-link-title h5").text()),
      thumbnailUrl: li.find("img.yomikiri-image").attr("src") ?? null,
      viewerUrlRaw: link.attr("href"),
      publishedAt: parseJapaneseDate(cleanText(li.find(".yomikiri-label-date").text())),
    });

    if (item) {
      items.push(item);
    }
  });

  return items;
}

import type { CheerioAPI } from "cheerio";
import type { Source } from "../../../config/sources.js";
import type { ParsedOneshot } from "../../types.js";
import { buildItem, cleanText } from "../common.js";

interface AttrSource {
  attr(name: string): string | undefined;
}

function resolveThumbnailUrl(img: AttrSource): string | null {
  const template = img.attr("data-src") ?? img.attr("src") ?? null;
  if (!template) {
    return null;
  }
  const width = img.attr("width");
  const height = img.attr("height");
  if (!width || !height) {
    return template;
  }
  return template.replace("{width}", width).replace("{height}", height);
}

export function extract($: CheerioAPI, source: Source): ParsedOneshot[] {
  const items: ParsedOneshot[] = [];

  $("ul.series-table-list li.subpage-table-list-item").each((_, el) => {
    const li = $(el);
    const link = li.find("> a").first();

    const item = buildItem({
      source,
      title: cleanText(li.find(".title").text()),
      author: cleanText(li.find(".author").text()),
      thumbnailUrl: resolveThumbnailUrl(li.find("img").first()),
      viewerUrlRaw: link.attr("href"),
      publishedAt: null,
    });

    if (item) {
      items.push(item);
    }
  });

  return items;
}

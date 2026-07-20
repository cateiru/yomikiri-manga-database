import type { CheerioAPI } from "cheerio";
import type { ParsedViewerDetail } from "../types.js";
import { cleanText, parseJapaneseDate, toAbsoluteUrl } from "./common.js";

export function extractViewerDetail($: CheerioAPI, viewerUrl: string): ParsedViewerDetail | null {
  const title = cleanText($(".series-header-title").first().text());
  if (!title) {
    return null;
  }

  const author = cleanText($(".series-header-author").first().text());
  const thumbnailImg = $("img.series-header-image").first();
  // GigaViewer のビューワーページは画像を遅延読み込みしており、実際の URL は
  // src ではなく data-src に入っている
  const thumbnailUrl = toAbsoluteUrl(
    thumbnailImg.attr("data-src") ?? thumbnailImg.attr("src") ?? null,
    viewerUrl,
  );
  const publishedAt = parseJapaneseDate(cleanText($(".episode-header-date").first().text()));
  const year = publishedAt ? publishedAt.getUTCFullYear() : null;

  return { title, author, thumbnailUrl, publishedAt, year };
}

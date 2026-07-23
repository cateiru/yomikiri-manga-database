import type { CheerioAPI } from "cheerio";
import { cleanText, toAbsoluteUrl } from "../shared.js";
import type { ParsedViewerDetail } from "../types.js";

// マガポケの掲載日表記は "2026/07/08" のようなスラッシュ区切り（GigaViewer の
// "年月日" とは異なるため gigaviewer/common.ts の parseJapaneseDate は使えない）
const MAGAPOKE_DATE_PATTERN = /(\d{4})\/(\d{1,2})\/(\d{1,2})/;

function parseMagapokeDate(text: string | null | undefined): Date | null {
  if (!text) {
    return null;
  }
  const match = text.match(MAGAPOKE_DATE_PATTERN);
  if (!match) {
    return null;
  }
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function extractViewerDetail($: CheerioAPI, viewerUrl: string): ParsedViewerDetail | null {
  const title = cleanText($(".p-episode__comic-ttl").first().text());
  if (!title) {
    return null;
  }

  const author = cleanText($(".p-episode__comic-name").first().text());
  const thumbnailUrl = toAbsoluteUrl(
    $('meta[name="thumbnail"]').attr("content") ??
      $('meta[property="og:image"]').attr("content") ??
      $(".p-episode__comic-img img").first().attr("src") ??
      null,
    viewerUrl,
  );
  const publishedAt = parseMagapokeDate(cleanText($(".p-episode__header-date").first().text()));
  const year = publishedAt ? publishedAt.getUTCFullYear() : null;

  return { title, author, thumbnailUrl, publishedAt, year };
}

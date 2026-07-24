import type { CheerioAPI } from "cheerio";
import { cleanText, toAbsoluteUrl } from "../shared.js";
import type { ParsedViewerDetail } from "../types.js";

// comici の掲載日表記は "2026年6月29日" のような年月日区切り
const COMICI_DATE_PATTERN = /(\d{4})年(\d{1,2})月(\d{1,2})日/;

function parseComiciDate(text: string | null | undefined): Date | null {
  if (!text) {
    return null;
  }
  const match = text.match(COMICI_DATE_PATTERN);
  if (!match) {
    return null;
  }
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function extractViewerDetail($: CheerioAPI, viewerUrl: string): ParsedViewerDetail | null {
  // 作品タイトルは話タイトル（[data-e2e="ehEpisodeTtl"]、第1話では「第1話」等になる）
  // ではなく、シリーズ名（[data-e2e="ehSeriesLnk"]）から取得する
  const title = cleanText($('[data-e2e="ehSeriesLnk"]').first().text());
  if (!title) {
    return null;
  }

  const author = cleanText($(".g-author-name").first().text());
  const thumbnailUrl = toAbsoluteUrl(
    $('meta[property="og:image"]').attr("content") ?? null,
    viewerUrl,
  );
  const publishedAt = parseComiciDate(cleanText($(".ep-main-h-date").first().text()));
  const year = publishedAt ? publishedAt.getUTCFullYear() : null;

  return { title, author, thumbnailUrl, publishedAt, year };
}

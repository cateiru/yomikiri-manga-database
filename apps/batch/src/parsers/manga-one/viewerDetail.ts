import type { CheerioAPI } from "cheerio";
import { cleanText, toAbsoluteUrl } from "../shared.js";
import type { ParsedViewerDetail } from "../types.js";

// マンガワンの掲載日表記は "2024/12/04" のようなスラッシュ区切り（マガポケと同形式）
const MANGA_ONE_DATE_PATTERN = /(\d{4})\/(\d{1,2})\/(\d{1,2})/;

function parseMangaOneDate(text: string | null | undefined): Date | null {
  if (!text) {
    return null;
  }
  const match = text.match(MANGA_ONE_DATE_PATTERN);
  if (!match) {
    return null;
  }
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return Number.isNaN(date.getTime()) ? null : date;
}

// header の h1 は "作品名  | 作品名" のように話タイトルと作品タイトルが "|" 区切りで
// 並ぶが、読み切りでは常に同一文字列になるため重複を取り除く
function dedupeTitle(text: string): string {
  const parts = text
    .split("|")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  return parts[0] ?? text.trim();
}

export function extractViewerDetail($: CheerioAPI, viewerUrl: string): ParsedViewerDetail | null {
  const rawTitle = $("header h1").first().text();
  const title = cleanText(rawTitle ? dedupeTitle(rawTitle) : null);
  if (!title) {
    return null;
  }

  // 著者名はビューワー内の著者アイコン（img[src*="/author_icon/"]）の alt 属性に入る
  const author = cleanText($('img[src*="/author_icon/"]').first().attr("alt"));
  const thumbnailUrl = toAbsoluteUrl($('meta[property="og:image"]').attr("content"), viewerUrl);
  const publishedAt = parseMangaOneDate($("header h1").first().next("span").text());
  const year = publishedAt ? publishedAt.getUTCFullYear() : null;

  return { title, author, thumbnailUrl, publishedAt, year };
}

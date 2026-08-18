import type { CheerioAPI } from "cheerio";
import { cleanText, toAbsoluteUrl } from "../shared.js";
import type { ParsedViewerDetail } from "../types.js";

// 掲載日表記は "2026/05/15" のようなスラッシュ区切り（マガポケ・COMIC FUZ と同形式）
const DATE_PATTERN = /(\d{4})\/(\d{1,2})\/(\d{1,2})/;

function parseComicBoostDate(text: string | null): Date | null {
  if (!text) {
    return null;
  }
  const match = text.match(DATE_PATTERN);
  if (!match) {
    return null;
  }
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function extractViewerDetail($: CheerioAPI, viewerUrl: string): ParsedViewerDetail | null {
  const title = cleanText($("h1.comic-title").first().text());
  if (!title) {
    return null;
  }

  // 「【8P読切企画】ブーストShorts」のような、複数の短編をまとめた連作ページは
  // タイトル・作者・掲載日が個々の短編（実質的には別々の読切作品）と一致しないため、
  // 話数が 1 件（単話の読切）でない場合は抽出失敗として扱う（無限リトライ防止のため
  // details_fetched_at のみ更新される）
  if ($(".book-product-list-item").length !== 1) {
    return null;
  }

  const authorNames = $(".comic-main-right .author-list li.author a")
    .map((_, el) => cleanText($(el).text()))
    .get()
    .filter((name): name is string => name !== null);
  const author = authorNames.length > 0 ? authorNames.join("、") : null;

  const thumbnailUrl = toAbsoluteUrl(
    $(".comic-main-thum-wrapper img.thum.only-pc").first().attr("src") ??
      $('meta[property="og:image"]').attr("content") ??
      null,
    viewerUrl,
  );

  const publishedAt = parseComicBoostDate(
    cleanText($(".book-product-list-item .update-date").first().text()),
  );
  const year = publishedAt ? publishedAt.getUTCFullYear() : null;

  return { title, author, thumbnailUrl, publishedAt, year };
}

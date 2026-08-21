import type { CheerioAPI } from "cheerio";
import { cleanText, toAbsoluteUrl } from "../shared.js";
import type { ParsedViewerDetail } from "../types.js";

// 掲載日表記は GigaViewer と同形式の "2026年8月19日更新!" だが、GigaViewer 固有の
// parseJapaneseDate は流用せずソースごとに独自定義する既存の慣習（comici 等参照）に揃える
const KIRAPO_DATE_PATTERN = /(\d{4})年(\d{1,2})月(\d{1,2})日/;

function parseKirapoDate(text: string | null | undefined): Date | null {
  if (!text) {
    return null;
  }
  const match = text.match(KIRAPO_DATE_PATTERN);
  if (!match) {
    return null;
  }
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return Number.isNaN(date.getTime()) ? null : date;
}

// 著者欄は「著者：」「漫画：」「原作：」等のラベル付きリンクが作品ごとに 1〜複数個並ぶため、
// ラベル部分を取り除いた上で全て連結する
function extractAuthor($: CheerioAPI): string | null {
  const names = $('a[href*="/authors/"]')
    .map((_, el) => cleanText($(el).text())?.replace(/^[^：]*：/, "") ?? null)
    .get()
    .filter((name): name is string => name !== null && name.length > 0);

  return names.length > 0 ? names.join("、") : null;
}

/**
 * ビューワーページ（BinB Reader）は静的 HTML に作品タイトル・著者名・掲載日を
 * 一切含まないため、対応する作品ページ（/{label}/titles/{slug}）の HTML から
 * 詳細を抽出する。作品ページ URL の導出は kirapo/index.ts の fetchViewerDetail 参照
 */
export function extractViewerDetail($: CheerioAPI, viewerUrl: string): ParsedViewerDetail | null {
  const title = cleanText($("h2").first().text());
  if (!title) {
    return null;
  }

  const author = extractAuthor($);
  const thumbnailUrl = toAbsoluteUrl($('meta[property="og:image"]').attr("content"), viewerUrl);
  // .last-update は作品ページ全体の最終更新日（＝最新話の掲載日）であり、対象読み切り
  // 自身の掲載日ではない場合がある。ただし読み切り（category=2）の作品ページは常に
  // 話が 1 つのみで両者が一致するため実害はない。連載作品が紛れ込んで複数話になった
  // 場合のみ、収集対象の話（episode-id 最小）とは異なる日付になり得るが、話ごとの
  // 掲載日は DOM 上に無く採り得る唯一の値のため、この制約は許容する
  const publishedAt = parseKirapoDate(cleanText($(".last-update").first().text()));
  const year = publishedAt ? publishedAt.getUTCFullYear() : null;

  return { title, author, thumbnailUrl, publishedAt, year };
}

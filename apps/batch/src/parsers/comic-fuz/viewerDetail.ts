import type { CheerioAPI } from "cheerio";
import { cleanText } from "../shared.js";
import type { ParsedViewerDetail } from "../types.js";

// COMIC FUZ の作品ページ（/manga/{mangaId}）は SSG（getStaticProps）で __NEXT_DATA__
// に作品情報がそのまま埋め込まれているため、ビューワーページ自体は署名不要の
// プレーンな HTML GET で取得できる（一覧の収集とは異なり headless 不要）
const IMG_BASE_URL = "https://img.comic-fuz.com";

// 掲載日表記は "2020/08/11" のようなスラッシュ区切り（マガポケと同形式）
const DATE_PATTERN = /(\d{4})\/(\d{1,2})\/(\d{1,2})/;

function parseComicFuzDate(text: unknown): Date | null {
  if (typeof text !== "string") {
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

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function countChapters(chapters: unknown): number {
  if (!Array.isArray(chapters)) {
    return 0;
  }
  return chapters.reduce((total, group) => {
    const groupChapters = asRecord(group)?.chapters;
    return total + (Array.isArray(groupChapters) ? groupChapters.length : 0);
  }, 0);
}

export function extractViewerDetail($: CheerioAPI, _viewerUrl: string): ParsedViewerDetail | null {
  const nextDataJson = $("#__NEXT_DATA__").text();
  if (!nextDataJson) {
    return null;
  }

  let nextData: unknown;
  try {
    nextData = JSON.parse(nextDataJson);
  } catch {
    return null;
  }

  const pageProps = asRecord(asRecord(asRecord(nextData)?.props)?.pageProps);
  if (!pageProps) {
    return null;
  }

  // 「FUZルーキー賞 結果発表」のような、複数の受賞作をまとめた特設ページは
  // mangaName/thumbnail が個々の話（実質的には別々の読切作品）と一致しないため、
  // 話数が 1 件（単話の読切）でない場合は抽出失敗として扱う（無限リトライ防止のため
  // details_fetched_at のみ更新される）
  if (countChapters(pageProps.chapters) !== 1) {
    return null;
  }

  const manga = asRecord(pageProps.manga);
  const title = cleanText(asString(manga?.mangaName));
  if (!title) {
    return null;
  }

  const authorships = Array.isArray(pageProps.authorships) ? pageProps.authorships : [];
  const authorNames = authorships
    .map((authorship) => asString(asRecord(asRecord(authorship)?.author)?.authorName))
    .filter((name): name is string => name !== null);
  const author = authorNames.length > 0 ? cleanText(authorNames.join("、")) : null;

  const thumbnailPath = asString(manga?.mainThumbnailUrl);
  const thumbnailUrl = thumbnailPath ? `${IMG_BASE_URL}${thumbnailPath}` : null;

  const publishedAt = parseComicFuzDate(manga?.latestUpdatedDate);
  const year = publishedAt ? publishedAt.getUTCFullYear() : null;

  return { title, author, thumbnailUrl, publishedAt, year };
}

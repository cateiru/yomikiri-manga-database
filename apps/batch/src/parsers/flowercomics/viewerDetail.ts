import type { CheerioAPI } from "cheerio";
import { cleanText, toAbsoluteUrl } from "../shared.js";
import type { ParsedViewerDetail } from "../types.js";
import { extractChapters, parseFlowerComicsDate } from "./chapters.js";

const CHAPTER_ID_PATTERN = /\/chapter\/(\d+)/;
const TITLE_NAME_PATTERN = /\\"titleName\\":\\"([^\\]*)\\"/;
const CHAPTER_MAIN_NAME_PATTERN = /\\"chapterMainName\\":\\"([^\\]*)\\"/;
const SITE_TITLE_SUFFIX = " | フラコミlike!";

/**
 * ビューワーページはキャンバス描画のマンガリーダーで、作品タイトル・作者名は
 * 可視 DOM に存在しない。og:title が
 * "{作品名} {話タイトル} {作者名} | フラコミlike!" の形式であることを利用し、
 * RSC ペイロードから得られる titleName・chapterMainName を prefix として
 * 差し引くことで作者名部分だけを取り出す。
 * titleName・chapterMainName は元データ側の末尾空白（サブタイトル未設定の
 * 話で "読み切り " のようになる等）をそのまま含むことがあるため、比較前に
 * 連続する空白を 1 つに正規化する
 */
function normalizeSpaces(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function extractAuthor(
  ogTitle: string | null,
  titleName: string,
  chapterMainName: string,
): string | null {
  if (!ogTitle?.endsWith(SITE_TITLE_SUFFIX)) {
    return null;
  }
  const withoutSuffix = normalizeSpaces(ogTitle.slice(0, -SITE_TITLE_SUFFIX.length));
  const prefix = normalizeSpaces(`${titleName} ${chapterMainName}`);
  if (!withoutSuffix.startsWith(prefix)) {
    return null;
  }
  return cleanText(withoutSuffix.slice(prefix.length));
}

export function extractViewerDetail($: CheerioAPI, viewerUrl: string): ParsedViewerDetail | null {
  const html = $.html();

  const title = cleanText(html.match(TITLE_NAME_PATTERN)?.[1] ?? null);
  if (!title) {
    return null;
  }

  const chapterMainName = cleanText(html.match(CHAPTER_MAIN_NAME_PATTERN)?.[1] ?? null) ?? "";
  const ogTitle = $('meta[property="og:title"]').attr("content") ?? null;
  const author = extractAuthor(ogTitle, title, chapterMainName);

  const thumbnailUrl = toAbsoluteUrl(
    $('meta[property="og:image"]').attr("content") ?? null,
    viewerUrl,
  );

  // 話一覧から自分自身（URL 中の chapter id と一致する話）の掲載日を採る。
  // 単純に最初の要素を採ると、複数パートに分割された話でパートごとに掲載日が
  // 異なる場合に誤った日付を拾ってしまうため
  const chapterId = Number(viewerUrl.match(CHAPTER_ID_PATTERN)?.[1]);
  const currentChapter = extractChapters(html).find((chapter) => chapter.id === chapterId);
  const publishedAt = parseFlowerComicsDate(currentChapter?.updated ?? null);
  const year = publishedAt ? publishedAt.getUTCFullYear() : null;

  return { title, author, thumbnailUrl, publishedAt, year };
}

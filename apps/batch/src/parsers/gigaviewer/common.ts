import type { Source } from "../../config/sources.js";
import { log } from "../../logger.js";
import type { ParsedOneshot } from "../types.js";

export function cleanText(text: string | null | undefined): string | null {
  if (!text) {
    return null;
  }
  const trimmed = text.replace(/\s+/g, " ").trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function toAbsoluteUrl(href: string | null | undefined, base: string): string | null {
  if (!href) {
    return null;
  }
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

const JAPANESE_DATE_PATTERN = /(\d{4})年(\d{1,2})月(\d{1,2})日/;

export function parseJapaneseDate(text: string | null | undefined): Date | null {
  if (!text) {
    return null;
  }
  const match = text.match(JAPANESE_DATE_PATTERN);
  if (!match) {
    return null;
  }
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return Number.isNaN(date.getTime()) ? null : date;
}

interface BuildItemParams {
  source: Source;
  title: string | null;
  author: string | null;
  thumbnailUrl: string | null;
  viewerUrlRaw: string | null | undefined;
  publishedAt: Date | null;
}

export function buildItem(params: BuildItemParams): ParsedOneshot | null {
  const viewerUrl = toAbsoluteUrl(params.viewerUrlRaw, params.source.listUrl);

  if (!params.title || !viewerUrl) {
    log("warn", "必須項目を抽出できなかったため要素をスキップしました", {
      sourceKey: params.source.key,
      title: params.title,
      viewerUrl,
    });
    return null;
  }

  return {
    title: params.title,
    author: params.author,
    thumbnailUrl: params.thumbnailUrl,
    viewerUrl,
    publishedAt: params.publishedAt,
  };
}

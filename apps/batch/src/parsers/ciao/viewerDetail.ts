import type { CheerioAPI } from "cheerio";
import { cleanText, toAbsoluteUrl } from "../shared.js";
import type { ParsedViewerDetail } from "../types.js";
import { extractNuxtApiCache, findApiCacheEntry } from "./nuxtData.js";

// ちゃおプラスの掲載日表記は "2023-08-10 00:00:00" のような JST の日時文字列。
// 他パーサー（gigaviewer/magapoke）と同様に時刻は無視し日付のみ Date.UTC で扱う
const CIAO_DATE_PATTERN = /(\d{4})-(\d{1,2})-(\d{1,2})/;

function parseCiaoDate(text: unknown): Date | null {
  if (typeof text !== "string") {
    return null;
  }
  const match = text.match(CIAO_DATE_PATTERN);
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

export function extractViewerDetail($: CheerioAPI, viewerUrl: string): ParsedViewerDetail | null {
  const nuxtDataJson = $("#__NUXT_DATA__").text();
  if (!nuxtDataJson) {
    return null;
  }

  const apiCache = extractNuxtApiCache(nuxtDataJson);
  if (!apiCache) {
    return null;
  }

  const episodeResponse = asRecord(findApiCacheEntry(apiCache, "/web/episode"));
  const episode = episodeResponse ? asRecord(episodeResponse.episode) : null;
  if (!episode) {
    return null;
  }

  const title = cleanText(asString(episode.episode_name));
  if (!title) {
    return null;
  }

  const titleListResponse = asRecord(findApiCacheEntry(apiCache, "/title/list"));
  const titleList = Array.isArray(titleListResponse?.title_list)
    ? titleListResponse.title_list
    : [];
  const titleInfo = asRecord(titleList[0]);

  const author = cleanText(asString(titleInfo?.author_text));
  const thumbnailUrl = toAbsoluteUrl(
    asString(episode.thumbnail_image_url) ?? asString(titleInfo?.banner_image_url),
    viewerUrl,
  );
  const publishedAt = parseCiaoDate(episode.start_time);
  const year = publishedAt ? publishedAt.getUTCFullYear() : null;

  return { title, author, thumbnailUrl, publishedAt, year };
}

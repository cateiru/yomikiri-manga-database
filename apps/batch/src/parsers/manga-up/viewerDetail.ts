import type { CheerioAPI } from "cheerio";
import { cleanText, toAbsoluteUrl } from "../shared.js";
import type { ParsedViewerDetail } from "../types.js";

interface ComicSeriesJsonLd {
  "@type"?: unknown;
  name?: unknown;
  author?: { name?: unknown };
}

/**
 * タイトル・著者は script[type="application/ld+json"] の中の ComicSeries ブロック
 * （{"@type":"ComicSeries","name":"...","author":{"name":"..."}}）から取得する。
 * ページ内には他の @type（WebSite・Organization 等）の ld+json も並んでいるため、
 * @type で絞り込む
 */
function extractComicSeries($: CheerioAPI): ComicSeriesJsonLd | null {
  for (const el of $('script[type="application/ld+json"]')) {
    const raw = $(el).contents().text();
    try {
      const json = JSON.parse(raw);
      if (json && typeof json === "object" && json["@type"] === "ComicSeries") {
        return json as ComicSeriesJsonLd;
      }
    } catch {
      // JSON として解釈できないブロックは無視する
    }
  }
  return null;
}

// マンガUP! のビューワーページ・作品ページには掲載日の情報が含まれないため常に null とする
export function extractViewerDetail($: CheerioAPI, viewerUrl: string): ParsedViewerDetail | null {
  const comicSeries = extractComicSeries($);
  const title = cleanText(typeof comicSeries?.name === "string" ? comicSeries.name : null);
  if (!title) {
    return null;
  }

  const author = cleanText(
    typeof comicSeries?.author?.name === "string" ? comicSeries.author.name : null,
  );
  const thumbnailUrl = toAbsoluteUrl(
    $('meta[property="og:image"]').attr("content") ?? null,
    viewerUrl,
  );

  return { title, author, thumbnailUrl, publishedAt: null, year: null };
}

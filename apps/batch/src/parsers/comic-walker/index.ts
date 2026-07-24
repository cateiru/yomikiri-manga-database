import * as cheerio from "cheerio";
import type { Source } from "../../config/sources.js";
import { log } from "../../logger.js";
import { buildUrlItem, toAbsoluteUrl } from "../shared.js";
import type { CollectUrlsDeps, ParsedOneshotUrl, Parser } from "../types.js";

/**
 * レーベル一覧ページ（/label）から各レーベルのキー（/label/{key} の {key}）を抽出する
 */
function extractLabelKeys($: cheerio.CheerioAPI): string[] {
  const keys = new Set<string>();

  $('li[class*="LabelLogoThumbnailList_labelListItem"] a[href^="/label/"]').each((_, el) => {
    const href = $(el).attr("href");
    const match = href?.match(/^\/label\/([^/?#]+)/);
    if (match?.[1]) {
      keys.add(match[1]);
    }
  });

  return [...keys];
}

/**
 * レーベルの読み切り一覧ページ（1 ページ分）から作品のビューワー URL を抽出する
 */
function extract($: cheerio.CheerioAPI, source: Source): ParsedOneshotUrl[] {
  const items: ParsedOneshotUrl[] = [];

  $('a[class*="WorkThumbnail_link"]').each((_, el) => {
    const item = buildUrlItem({ source, viewerUrlRaw: $(el).attr("href") });
    if (item) {
      items.push(item);
    }
  });

  return items;
}

/**
 * ページネーションの「次のページへ」リンク（rel="next"）から次ページの URL を返す。
 * 最終ページでは rel="next" のリンク自体が存在しないため null を返す
 */
function findNextPageUrl($: cheerio.CheerioAPI, currentUrl: string): string | null {
  const href = $('a[rel="next"]').first().attr("href");
  return toAbsoluteUrl(href, currentUrl);
}

/**
 * 1 レーベル分の読み切りを、ページネーションを辿りながら収集する。
 * URL を訪問済み集合で管理し、rel="next" の指す先が誤って循環した場合の
 * 無限ループを防ぐ
 */
async function collectLabelOneshots(
  source: Source,
  labelKey: string,
  deps: CollectUrlsDeps,
): Promise<ParsedOneshotUrl[]> {
  const items: ParsedOneshotUrl[] = [];
  const visited = new Set<string>();

  let url: string | null = new URL(`/label/${labelKey}/one-shot`, source.siteUrl).toString();

  while (url && !visited.has(url)) {
    visited.add(url);

    const html = await deps.fetchAllowedHtml(url);
    const $ = cheerio.load(html);
    items.push(...extract($, source));
    url = findNextPageUrl($, url);
  }

  return items;
}

async function collectUrls(source: Source, deps: CollectUrlsDeps): Promise<ParsedOneshotUrl[]> {
  const labelListUrl = new URL("/label", source.siteUrl).toString();
  const labelListHtml = await deps.fetchAllowedHtml(labelListUrl);
  const labelKeys = extractLabelKeys(cheerio.load(labelListHtml));

  const items: ParsedOneshotUrl[] = [];

  for (const labelKey of labelKeys) {
    try {
      items.push(...(await collectLabelOneshots(source, labelKey, deps)));
    } catch (error) {
      // 1 レーベルの失敗が他レーベルの収集を止めないよう、ログのみ残して続行する
      log("warn", "レーベルの読み切り収集に失敗しました", {
        sourceKey: source.key,
        labelKey,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return items;
}

export const comicWalkerParser: Parser = {
  parse(html, source) {
    return extract(cheerio.load(html), source);
  },
  collectUrls,
};

import * as cheerio from "cheerio";
import type { Source } from "../../config/sources.js";
import { log } from "../../logger.js";
import { buildUrlItem } from "../shared.js";
import type {
  CollectUrlsDeps,
  FetchViewerDetailDeps,
  ParsedOneshotUrl,
  ParsedViewerDetail,
  Parser,
} from "../types.js";
import { extractViewerDetail } from "./viewerDetail.js";

const TITLE_URL_PATTERN = /^\/[^/]+\/titles\/[^/]+$/;

/**
 * 一覧ページ（作品カード）から作品ページ URL を抽出する。ここで得られる URL は
 * ビューワー（/pt/...）ではなく作品ページ（/{label}/titles/{slug}）で、実際の
 * ビューワー URL 解決には作品ページへの追加フェッチが必要（collectUrls 参照）
 */
function extractTitleUrls($: cheerio.CheerioAPI, source: Source): ParsedOneshotUrl[] {
  const items: ParsedOneshotUrl[] = [];
  const seen = new Set<string>();

  $("#titles-container a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) {
      return;
    }
    let pathname: string;
    try {
      pathname = new URL(href, source.siteUrl).pathname;
    } catch {
      return;
    }
    if (!TITLE_URL_PATTERN.test(pathname)) {
      return;
    }
    const item = buildUrlItem({ source, viewerUrlRaw: href });
    if (item && !seen.has(item.viewerUrl)) {
      seen.add(item.viewerUrl);
      items.push(item);
    }
  });

  return items;
}

interface TitleListApiItem {
  url?: string;
}

interface TitleListApiResponse {
  data?: TitleListApiItem[];
}

function extractApiTitleUrls(json: string, source: Source): ParsedOneshotUrl[] {
  let parsed: TitleListApiResponse;
  try {
    parsed = JSON.parse(json);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed.data)) {
    return [];
  }

  const items: ParsedOneshotUrl[] = [];
  for (const entry of parsed.data) {
    const item = buildUrlItem({ source, viewerUrlRaw: entry.url });
    if (item) {
      items.push(item);
    }
  }
  return items;
}

/**
 * 一覧ページは最初の数十件のみ静的 HTML に埋め込まれており、残りは
 * 「もっと見る」ボタン相当の内部 API（/api/title-list）を 1 回叩くことで
 * まとめて取得できる（ボタンがクリックされるとフロント側では以後このボタンごと
 * 消去され、二重にページングされることはない）。ボタンが存在しない一覧
 * （全件が最初から埋め込まれている場合）はこの追加フェッチをスキップする
 */
function buildMoreTitlesApiUrl($: cheerio.CheerioAPI, source: Source): string | null {
  const button = $("#more_titles_button");
  if (button.length === 0) {
    return null;
  }

  const readAt = button.attr("data-read-at");
  const filter = $('meta[name="filter"]').attr("content");
  const id = $('meta[name="id"]').attr("content");
  if (!readAt || !filter || !id) {
    return null;
  }

  const params = new URLSearchParams({ read_at: readAt });
  if (filter !== "0") {
    params.set(filter, id);
  }

  return new URL(`/api/title-list?${params}`, source.siteUrl).toString();
}

async function collectTitleUrls(source: Source, deps: CollectUrlsDeps): Promise<Set<string>> {
  const titleUrls = new Set<string>();

  for (const listUrl of source.listUrls) {
    const html = await deps.fetchAllowedHtml(listUrl);
    const $ = cheerio.load(html);

    for (const item of extractTitleUrls($, source)) {
      titleUrls.add(item.viewerUrl);
    }

    const apiUrl = buildMoreTitlesApiUrl($, source);
    if (!apiUrl) {
      continue;
    }

    try {
      const json = await deps.fetchAllowedHtml(apiUrl);
      for (const item of extractApiTitleUrls(json, source)) {
        titleUrls.add(item.viewerUrl);
      }
    } catch (error) {
      // 追加分の取得に失敗しても、既に埋め込まれている分の収集は続行する
      log("warn", "作品一覧 API の取得に失敗しました", {
        sourceKey: source.key,
        listUrl,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return titleUrls;
}

const EPISODE_READ_SELECTOR = "a.episode-read[data-episode-id]";

/**
 * 作品ページから最初の話（第1話、episode-id が最小の話）のビューワー URL を
 * 抽出する。読み切りは基本 1 話のみだが、連載作品の一覧に混ざって収集された
 * 場合など複数話が存在することがあるため、常に episode-id が最小（＝最初の話）
 * を採用する（「最新話を読む」ボタンではなく「第1話を読む」相当を選ぶ）
 */
function extractEarliestEpisodeUrl(html: string, source: Source): ParsedOneshotUrl | null {
  const $ = cheerio.load(html);
  const episodes: { id: number; href: string }[] = [];

  $(EPISODE_READ_SELECTOR).each((_, el) => {
    const href = $(el).attr("href");
    const idRaw = $(el).attr("data-episode-id");
    const id = idRaw ? Number(idRaw) : Number.NaN;
    if (!href || Number.isNaN(id)) {
      return;
    }
    episodes.push({ id, href });
  });

  const earliest = episodes.reduce<{ id: number; href: string } | null>(
    (min, episode) => (min === null || episode.id < min.id ? episode : min),
    null,
  );

  if (!earliest) {
    return null;
  }
  return buildUrlItem({ source, viewerUrlRaw: earliest.href });
}

async function collectUrls(source: Source, deps: CollectUrlsDeps): Promise<ParsedOneshotUrl[]> {
  const titleUrls = await collectTitleUrls(source, deps);

  const items: ParsedOneshotUrl[] = [];
  for (const titleUrl of titleUrls) {
    try {
      const html = await deps.fetchAllowedHtml(titleUrl);
      const item = extractEarliestEpisodeUrl(html, source);
      if (item) {
        items.push(item);
      } else {
        log("warn", "作品ページからビューワー URL を抽出できませんでした", {
          sourceKey: source.key,
          titleUrl,
        });
      }
    } catch (error) {
      // 1 作品の取得失敗が他作品の収集を止めないよう、ログのみ残して続行する
      log("warn", "作品ページの取得に失敗しました", {
        sourceKey: source.key,
        titleUrl,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return items;
}

const VIEWER_URL_PATTERN = /^https:\/\/kirapo\.jp\/pt\/([^/]+)\/([^/]+)\/\d+\/viewer\/?$/;

/**
 * ビューワー URL（/pt/{label}/{slug}/{episodeId}/viewer）から対応する作品ページ
 * URL（/{label}/titles/{slug}）を導出する。作品ページの詳細取得（fetchViewerDetail）
 * で使う
 */
function deriveTitleUrl(viewerUrl: string): string | null {
  const match = viewerUrl.match(VIEWER_URL_PATTERN);
  if (!match) {
    return null;
  }
  const [, label, slug] = match;
  return `https://kirapo.jp/${label}/titles/${slug}`;
}

async function fetchViewerDetail(
  viewerUrl: string,
  deps: FetchViewerDetailDeps,
): Promise<ParsedViewerDetail | null> {
  const titleUrl = deriveTitleUrl(viewerUrl);
  if (!titleUrl) {
    return null;
  }

  const html = await deps.fetchAllowedHtml(titleUrl);
  return extractViewerDetail(cheerio.load(html), viewerUrl);
}

export const kirapoParser: Parser = {
  parse(html, source) {
    // 一覧ページ単体の同期抽出（作品ページ URL を返す）。実際のビューワー URL
    // 解決・残り件数の取得には追加フェッチが必要なため、本番の収集経路では
    // 代わりに collectUrls を使う
    return extractTitleUrls(cheerio.load(html), source);
  },
  collectUrls,
  fetchViewerDetail,
};

import * as cheerio from "cheerio";
import type { Source } from "../../config/sources.js";
import { buildUrlItem } from "../shared.js";
import type {
  CollectUrlsDeps,
  FetchViewerDetailDeps,
  ParsedOneshotUrl,
  ParsedViewerDetail,
  Parser,
} from "../types.js";
import { extractViewerDetail } from "./viewerDetail.js";

// 読切一覧・ビューワーページとも内容がクライアントサイド JS の描画に依存し、静的
// HTML には含まれない（一覧は独自バイナリ形式の内部 API、ビューワーは掲載日が
// クライアント側でしか表示されない）ため、収集・詳細取得の両方で headless
// Chromium による描画後 DOM の取得が必要
const LIST_ITEM_SELECTOR = 'main ul li a[href^="/manga/"]';
const VIEWER_READY_SELECTOR = "header h1";

async function collectUrls(source: Source, deps: CollectUrlsDeps): Promise<ParsedOneshotUrl[]> {
  if (!deps.fetchAllowedRenderedHtml) {
    throw new Error("manga-one の収集には fetchAllowedRenderedHtml が必要です");
  }

  const listUrl = source.listUrls[0];
  if (!listUrl) {
    throw new Error("manga-one の収集には listUrls が必要です");
  }

  const html = await deps.fetchAllowedRenderedHtml(listUrl, LIST_ITEM_SELECTOR);
  const $ = cheerio.load(html);

  // レスポンシブ対応のため同一作品への link が複数 DOM に重複して存在することがあるため、
  // viewerUrl で重複排除する
  const seen = new Set<string>();
  const items: ParsedOneshotUrl[] = [];
  for (const el of $(LIST_ITEM_SELECTOR)) {
    const item = buildUrlItem({ source, viewerUrlRaw: $(el).attr("href") });
    if (item && !seen.has(item.viewerUrl)) {
      seen.add(item.viewerUrl);
      items.push(item);
    }
  }

  return items;
}

async function fetchViewerDetail(
  viewerUrl: string,
  deps: FetchViewerDetailDeps,
): Promise<ParsedViewerDetail | null> {
  const html = await deps.fetchAllowedRenderedHtml(viewerUrl, VIEWER_READY_SELECTOR);
  return extractViewerDetail(cheerio.load(html), viewerUrl);
}

export const mangaOneParser: Parser = {
  parse(): ParsedOneshotUrl[] {
    // マンガワンは静的な一覧 HTML から作品を抽出できないため collectUrls を使う
    throw new Error("manga-one は parse() 未対応です（collectUrls を使用してください）");
  },
  collectUrls,
  fetchViewerDetail,
};

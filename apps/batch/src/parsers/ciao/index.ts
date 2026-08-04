import { z } from "zod";
import type { Source } from "../../config/sources.js";
import { buildUrlItem } from "../shared.js";
import type { CollectUrlsDeps, ParsedOneshotUrl, Parser } from "../types.js";

// "166" はちゃおプラス内部のタグ ID で「読切」（/keyword/list?is_group=0 で確認済み）。
// このページ自身が limit=99999 で1回のリクエストに全件（確認時点で290件）を含めて
// 返すため、ページネーションは発生しない。sources.json の listUrls はスキーマ上
// 必須のため値は入っているが、実際の収集ロジックでは参照しない（comici と同様）
const ONESHOT_TAG_SEARCH_PATH = "/comics/search/keyword/166";
const SEARCH_TITLE_API_PREFIX = "https://api.ciao.shogakukan.co.jp/search/title";

const ciaoSearchTitleResponseSchema = z.object({
  title_list: z.array(
    z.object({
      title_id: z.number(),
      first_episode_id: z.number(),
    }),
  ),
});

function padId(id: number): string {
  return String(id).padStart(5, "0");
}

async function collectUrls(source: Source, deps: CollectUrlsDeps): Promise<ParsedOneshotUrl[]> {
  if (!deps.fetchAllowedViaHeadless) {
    throw new Error("ciao の収集には fetchAllowedViaHeadless が必要です");
  }

  const searchUrl = new URL(ONESHOT_TAG_SEARCH_PATH, source.siteUrl).toString();
  const raw = await deps.fetchAllowedViaHeadless<unknown>(searchUrl, (url) =>
    url.startsWith(SEARCH_TITLE_API_PREFIX),
  );
  const { title_list: titleList } = ciaoSearchTitleResponseSchema.parse(raw);

  const items: ParsedOneshotUrl[] = [];
  for (const title of titleList) {
    const item = buildUrlItem({
      source,
      viewerUrlRaw: `/comics/title/${padId(title.title_id)}/episode/${padId(title.first_episode_id)}`,
    });
    if (item) {
      items.push(item);
    }
  }

  return items;
}

export const ciaoParser: Parser = {
  parse(): ParsedOneshotUrl[] {
    // ちゃおプラスは静的な一覧 HTML が存在せず collectUrls 経由でしか収集できないため、
    // 誤って呼ばれた場合は明示的に失敗させる（comici/comic-walker と異なりここは
    // 到達しない想定）
    throw new Error("ciao は parse() 未対応です（collectUrls を使用してください）");
  },
  collectUrls,
};

import type { Source } from "../config/sources.js";

export interface ParsedOneshotUrl {
  viewerUrl: string;
}

export interface ParsedViewerDetail {
  title: string;
  author: string | null;
  thumbnailUrl: string | null;
  publishedAt: Date | null;
  year: number | null;
}

/**
 * collectUrls を実装する Parser に渡す依存関数。
 * robots.txt チェックとソース単位のレート制限（1 req/sec）を呼び出し側で
 * まとめて行うため、Parser 実装は URL を渡すだけでよい
 */
export interface CollectUrlsDeps {
  fetchAllowedHtml(url: string): Promise<string>;
  /**
   * 静的 HTML の取得だけでは中身を得られない SPA サイト向け。headless Chromium で
   * 実際にページを開き、ページ自身の JS が発行するレスポンスのうち matchResponse に
   * マッチした JSON を返す。レート制限は fetchAllowedHtml とは別に管理される（重い
   * ページ遷移のため間隔を長めに取る）
   */
  fetchAllowedViaHeadless?<T>(url: string, matchResponse: (url: string) => boolean): Promise<T>;
}

export interface Parser {
  parse(html: string, source: Source): ParsedOneshotUrl[];
  /**
   * 一覧ページの URL 自体を動的に発見する必要があるソース（例: レーベル一覧や
   * ページネーションを辿る必要があるサイト）向けのオプショナルな収集メソッド。
   * 実装がある場合、collectUrls.ts は source.listUrls のループの代わりにこちらを使う
   */
  collectUrls?(source: Source, deps: CollectUrlsDeps): Promise<ParsedOneshotUrl[]>;
}

import { chromium } from "playwright";
import { USER_AGENT } from "./fetchHtml.js";

// headless Chromium でのページ読み込みは通常の HTML 取得より相手サーバーへの負荷が
// 大きい（HTML 本体に加えて JS 自身が発行する XHR も走る）ため、間隔を長めに取る。
// collectUrls.ts / fetchDetails.ts の双方から参照する共通値
export const HEADLESS_REQUEST_INTERVAL_MS = 10000;

// 画像・フォント・動画・スタイルシートはページの描画には必要だが、収集したい
// XHR レスポンスの取得には不要なため中断し、相手サーバーへのリクエスト数を減らす
const BLOCKED_RESOURCE_TYPES = new Set(["image", "font", "media", "stylesheet"]);

export interface HeadlessFetchOptions {
  /** ページ遷移中に発生するレスポンスのうち、これにマッチするものを収集対象とする */
  matchResponse: (url: string) => boolean;
  timeoutMs?: number;
}

/**
 * headless Chromium で実際にページを開き、ページ自身の JS が発行する XHR/fetch の
 * レスポンス JSON を横取りして返す。署名付き内部 API 等、静的 HTML の取得だけでは
 * 中身を得られない SPA サイト向け（ちゃおプラス以外の SPA サイトでも再利用する想定）
 */
export async function fetchJsonViaHeadless<T>(
  url: string,
  options: HeadlessFetchOptions,
): Promise<T> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ userAgent: USER_AGENT });

    await page.route("**/*", (route) => {
      const request = route.request();
      if (BLOCKED_RESOURCE_TYPES.has(request.resourceType())) {
        return route.abort();
      }
      return route.continue();
    });

    const responsePromise = page.waitForResponse(
      (response) => options.matchResponse(response.url()),
      { timeout: options.timeoutMs ?? 20000 },
    );

    await page.goto(url, { waitUntil: "domcontentloaded" });
    const response = await responsePromise;

    return (await response.json()) as T;
  } finally {
    await browser.close();
  }
}

export interface HeadlessRenderOptions {
  /** このセレクタが出現するまで待ってから DOM を取得する（クライアントサイド描画の完了待ち） */
  waitForSelector: string;
  timeoutMs?: number;
}

/**
 * headless Chromium で実際にページを開き、クライアントサイド JS による描画が
 * 完了した後の DOM を HTML 文字列として返す。一覧・詳細ともに XHR レスポンスが
 * JSON ではなく（バイナリ等の）独自形式で、DOM から直接抽出するしかないサイト向け
 * （マンガワン等）
 */
export async function fetchRenderedHtml(
  url: string,
  options: HeadlessRenderOptions,
): Promise<string> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ userAgent: USER_AGENT });

    await page.route("**/*", (route) => {
      const request = route.request();
      if (BLOCKED_RESOURCE_TYPES.has(request.resourceType())) {
        return route.abort();
      }
      return route.continue();
    });

    await page.goto(url, { waitUntil: "networkidle", timeout: options.timeoutMs ?? 30000 });
    await page.waitForSelector(options.waitForSelector, { timeout: options.timeoutMs ?? 20000 });

    return await page.content();
  } finally {
    await browser.close();
  }
}

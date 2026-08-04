import { chromium } from "playwright";
import { USER_AGENT } from "./fetchHtml.js";

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

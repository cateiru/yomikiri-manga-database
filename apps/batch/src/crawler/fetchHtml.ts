export const USER_AGENT =
  "yomikiri-manga-database/1.0 (+https://github.com/cateiru/yomikiri-manga-database)";

/**
 * HTTP レスポンスが 2xx 以外だった場合に投げられるエラー。
 * status を保持することで、呼び出し側が「404/410 のような恒久的なエラー」と
 * 「5xx のような一時的なエラー」を区別できるようにする
 */
export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, statusText: string) {
    super(`HTTP ${status} ${statusText}`);
    this.name = "HttpError";
    this.status = status;
  }
}

// リトライ間隔。1 req/sec のクロールマナー（REQUEST_INTERVAL_MS）を
// リトライ時も破らないよう、それ以上の間隔を空ける
const RETRY_DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * タイムアウト（AbortError）・fetch 自体が失敗するようなネットワークエラー・
 * 5xx は「サイト側やネットワークの一時的な不調」である可能性が高くリトライで
 * 解消しうるため、それ以外（4xx 等の恒久的なエラー）と区別してリトライ対象とする
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof HttpError) {
    return error.status >= 500;
  }
  if (error instanceof DOMException) {
    return error.name === "AbortError";
  }
  return error instanceof TypeError;
}

async function fetchHtmlOnce(url: string, timeoutMs: number): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new HttpError(res.status, res.statusText);
    }
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchHtml(url: string, timeoutMs = 15000, retries = 1): Promise<string> {
  try {
    return await fetchHtmlOnce(url, timeoutMs);
  } catch (error) {
    if (retries > 0 && isRetryableError(error)) {
      await sleep(RETRY_DELAY_MS);
      return fetchHtml(url, timeoutMs, retries - 1);
    }
    throw error;
  }
}

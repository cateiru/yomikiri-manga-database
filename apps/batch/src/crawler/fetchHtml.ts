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

export async function fetchHtml(url: string, timeoutMs = 15000): Promise<string> {
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

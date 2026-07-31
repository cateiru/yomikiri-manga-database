import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchHtml, HttpError } from "./fetchHtml.js";

function htmlResponse(html: string): Response {
  return new Response(html, { status: 200, statusText: "OK" });
}

function statusResponse(status: number, statusText: string): Response {
  return new Response("", { status, statusText });
}

describe("fetchHtml", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("タイムアウト（AbortError）の場合は 1 回だけリトライして成功させる", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new DOMException("This operation was aborted", "AbortError"))
      .mockResolvedValueOnce(htmlResponse("<html>ok</html>"));
    vi.stubGlobal("fetch", fetchMock);

    const promise = fetchHtml("https://example.com/");
    await vi.advanceTimersByTimeAsync(1000);

    await expect(promise).resolves.toBe("<html>ok</html>");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("5xx エラーの場合は 1 回だけリトライして成功させる", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(statusResponse(503, "Service Unavailable"))
      .mockResolvedValueOnce(htmlResponse("<html>ok</html>"));
    vi.stubGlobal("fetch", fetchMock);

    const promise = fetchHtml("https://example.com/");
    await vi.advanceTimersByTimeAsync(1000);

    await expect(promise).resolves.toBe("<html>ok</html>");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("404 のような恒久的なエラーはリトライしない", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(statusResponse(404, "Not Found"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchHtml("https://example.com/")).rejects.toThrow(HttpError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("リトライしても失敗し続ける場合は最後のエラーを投げる", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockRejectedValue(new DOMException("This operation was aborted", "AbortError"));
    vi.stubGlobal("fetch", fetchMock);

    const promise = fetchHtml("https://example.com/");
    const assertion = expect(promise).rejects.toThrow("This operation was aborted");
    await vi.advanceTimersByTimeAsync(1000);
    await assertion;

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

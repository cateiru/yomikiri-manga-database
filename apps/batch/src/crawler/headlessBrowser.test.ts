import { chromium } from "playwright";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchJsonViaHeadless } from "./headlessBrowser.js";

type RouteHandler = (route: {
  request: () => { resourceType: () => string };
  abort: () => void;
  continue: () => void;
}) => void;

function createFakePage(options: { waitForResponse: unknown; goto?: () => Promise<void> }): {
  page: {
    route: ReturnType<typeof vi.fn>;
    waitForResponse: ReturnType<typeof vi.fn>;
    goto: ReturnType<typeof vi.fn>;
  };
  getRouteHandler: () => RouteHandler;
} {
  const route = vi.fn();
  const waitForResponse = vi.fn().mockResolvedValue(options.waitForResponse);
  const goto = vi.fn(options.goto ?? (() => Promise.resolve()));

  return {
    page: { route, waitForResponse, goto },
    getRouteHandler: () => route.mock.calls[0]?.[1] as RouteHandler,
  };
}

describe("fetchJsonViaHeadless", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("matchResponse に一致したレスポンスの JSON を返し、ブラウザを閉じる", async () => {
    const json = vi.fn().mockResolvedValue({ hello: "world" });
    const { page } = createFakePage({ waitForResponse: { json } });
    const close = vi.fn().mockResolvedValue(undefined);
    const newPage = vi.fn().mockResolvedValue(page);
    vi.spyOn(chromium, "launch").mockResolvedValue({ newPage, close } as never);

    const result = await fetchJsonViaHeadless("https://example.com/", {
      matchResponse: (url) => url.includes("/api/"),
    });

    expect(result).toEqual({ hello: "world" });
    expect(page.goto).toHaveBeenCalledWith("https://example.com/", {
      waitUntil: "domcontentloaded",
    });
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("画像・フォント・動画・スタイルシートのリクエストは中断し、それ以外は継続する", async () => {
    const { page, getRouteHandler } = createFakePage({
      waitForResponse: { json: vi.fn().mockResolvedValue({}) },
    });
    const close = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(chromium, "launch").mockResolvedValue({
      newPage: vi.fn().mockResolvedValue(page),
      close,
    } as never);

    await fetchJsonViaHeadless("https://example.com/", { matchResponse: () => true });

    const handler = getRouteHandler();
    for (const resourceType of ["image", "font", "media", "stylesheet"]) {
      const abort = vi.fn();
      const cont = vi.fn();
      handler({ request: () => ({ resourceType: () => resourceType }), abort, continue: cont });
      expect(abort).toHaveBeenCalledTimes(1);
      expect(cont).not.toHaveBeenCalled();
    }

    const abort = vi.fn();
    const cont = vi.fn();
    handler({ request: () => ({ resourceType: () => "xhr" }), abort, continue: cont });
    expect(cont).toHaveBeenCalledTimes(1);
    expect(abort).not.toHaveBeenCalled();
  });

  it("goto がエラーになった場合もブラウザを閉じてからエラーを投げる", async () => {
    const { page } = createFakePage({
      waitForResponse: { json: vi.fn() },
      goto: () => Promise.reject(new Error("navigation failed")),
    });
    const close = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(chromium, "launch").mockResolvedValue({
      newPage: vi.fn().mockResolvedValue(page),
      close,
    } as never);

    await expect(
      fetchJsonViaHeadless("https://example.com/", { matchResponse: () => true }),
    ).rejects.toThrow("navigation failed");
    expect(close).toHaveBeenCalledTimes(1);
  });
});

import { chromium } from "playwright";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HttpError } from "./fetchHtml.js";
import { fetchJsonViaHeadless, fetchRenderedHtml } from "./headlessBrowser.js";

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

function createFakeRenderPage(options: {
  gotoResponse?: { ok: () => boolean; status: () => number; statusText: () => string } | null;
  content?: string;
}): {
  page: {
    route: ReturnType<typeof vi.fn>;
    goto: ReturnType<typeof vi.fn>;
    waitForSelector: ReturnType<typeof vi.fn>;
    content: ReturnType<typeof vi.fn>;
  };
} {
  const route = vi.fn();
  const goto = vi
    .fn()
    .mockResolvedValue(
      options.gotoResponse === undefined
        ? { ok: () => true, status: () => 200, statusText: () => "OK" }
        : options.gotoResponse,
    );
  const waitForSelector = vi.fn().mockResolvedValue(undefined);
  const content = vi.fn().mockResolvedValue(options.content ?? "<html></html>");

  return { page: { route, goto, waitForSelector, content } };
}

describe("fetchRenderedHtml", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("waitForSelector の出現を待ってから描画済み DOM を返し、ブラウザを閉じる", async () => {
    const { page } = createFakeRenderPage({ content: "<html><body>ok</body></html>" });
    const close = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(chromium, "launch").mockResolvedValue({
      newPage: vi.fn().mockResolvedValue(page),
      close,
    } as never);

    const html = await fetchRenderedHtml("https://example.com/", {
      waitForSelector: "main ul li",
    });

    expect(html).toBe("<html><body>ok</body></html>");
    expect(page.goto).toHaveBeenCalledWith("https://example.com/", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    expect(page.waitForSelector).toHaveBeenCalledWith("main ul li", { timeout: 20000 });
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("goto のレスポンスが 2xx でない場合は HttpError を投げてブラウザを閉じる", async () => {
    const { page } = createFakeRenderPage({
      gotoResponse: { ok: () => false, status: () => 404, statusText: () => "Not Found" },
    });
    const close = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(chromium, "launch").mockResolvedValue({
      newPage: vi.fn().mockResolvedValue(page),
      close,
    } as never);

    const error = await fetchRenderedHtml("https://example.com/", {
      waitForSelector: "main ul li",
    }).catch((e) => e);

    expect(error).toBeInstanceOf(HttpError);
    expect((error as InstanceType<typeof HttpError>).status).toBe(404);
    expect(page.waitForSelector).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("goto がレスポンスを返さない場合もエラーになりブラウザを閉じる", async () => {
    const { page } = createFakeRenderPage({ gotoResponse: null });
    const close = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(chromium, "launch").mockResolvedValue({
      newPage: vi.fn().mockResolvedValue(page),
      close,
    } as never);

    await expect(
      fetchRenderedHtml("https://example.com/", { waitForSelector: "main ul li" }),
    ).rejects.toThrow("レスポンスを取得できませんでした");
    expect(close).toHaveBeenCalledTimes(1);
  });
});

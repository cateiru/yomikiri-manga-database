import { describe, expect, it, vi } from "vitest";
import type { Source } from "../../config/sources.js";
import { loadFixture } from "../../test-utils/loadFixture.js";
import { kirapoParser } from "./index.js";

const source: Source = {
  key: "kirapo",
  name: "きら星ポータル きらポ",
  listUrls: ["https://kirapo.jp/titles?category=2"],
  siteUrl: "https://kirapo.jp/",
  parser: "kirapo",
  enabled: true,
  favicon: "/favicons/kirapo.png",
};

describe("kirapo/parse", () => {
  it("フィクスチャから作品ページ URL を重複なく抽出できる", () => {
    const html = loadFixture("kirapo-titles");
    const items = kirapoParser.parse(html, source);

    expect(items).toEqual([
      { viewerUrl: "https://kirapo.jp/meteor/titles/sample1" },
      { viewerUrl: "https://kirapo.jp/polaris/titles/sample2" },
    ]);
  });
});

describe("kirapo/collectUrls", () => {
  it("一覧の埋め込み分 + 追加 API 分を収集し、各作品の episode-id が最小の話を採用する", async () => {
    const pages: Record<string, string> = {
      "https://kirapo.jp/titles?category=2": loadFixture("kirapo-titles"),
      "https://kirapo.jp/api/title-list?read_at=2026-08-21+11%3A32%3A35&category=2": loadFixture(
        "kirapo-title-list-more",
        "json",
      ),
      "https://kirapo.jp/meteor/titles/sample1": loadFixture("kirapo-title"),
      "https://kirapo.jp/polaris/titles/sample2": loadFixture("kirapo-title-multi"),
      "https://kirapo.jp/ambre/titles/sample3": loadFixture("kirapo-title-sample3"),
    };

    const fetchAllowedHtml = vi.fn(async (url: string) => {
      const html = pages[url];
      if (!html) {
        throw new Error(`unexpected url: ${url}`);
      }
      return html;
    });

    const items = await kirapoParser.collectUrls?.(source, { fetchAllowedHtml });

    expect(items).toEqual([
      { viewerUrl: "https://kirapo.jp/pt/meteor/sample1/1001/viewer" },
      // 「最新話を読む」（2102）ではなく episode-id が最小の第1話（2101）を採用する
      { viewerUrl: "https://kirapo.jp/pt/polaris/sample2/2101/viewer" },
      { viewerUrl: "https://kirapo.jp/pt/ambre/sample3/3001/viewer" },
    ]);
    // 一覧ページ1件 + 追加 API 1件 + 作品ページ3件
    expect(fetchAllowedHtml).toHaveBeenCalledTimes(5);
  });

  it("もっと見るボタンが無い一覧では追加 API を呼ばない", async () => {
    const pages: Record<string, string> = {
      "https://kirapo.jp/titles?category=2": loadFixture("kirapo-titles-no-more"),
      "https://kirapo.jp/meteor/titles/sample1": loadFixture("kirapo-title"),
    };

    const fetchAllowedHtml = vi.fn(async (url: string) => {
      const html = pages[url];
      if (!html) {
        throw new Error(`unexpected url: ${url}`);
      }
      return html;
    });

    const items = await kirapoParser.collectUrls?.(source, { fetchAllowedHtml });

    expect(items).toEqual([{ viewerUrl: "https://kirapo.jp/pt/meteor/sample1/1001/viewer" }]);
    expect(fetchAllowedHtml).toHaveBeenCalledTimes(2);
  });

  it("1作品の取得失敗が他作品の収集を止めない", async () => {
    const pages: Record<string, string> = {
      "https://kirapo.jp/titles?category=2": loadFixture("kirapo-titles"),
      "https://kirapo.jp/api/title-list?read_at=2026-08-21+11%3A32%3A35&category=2": loadFixture(
        "kirapo-title-list-more",
        "json",
      ),
      "https://kirapo.jp/meteor/titles/sample1": loadFixture("kirapo-title"),
    };

    const fetchAllowedHtml = vi.fn(async (url: string) => {
      if (url === "https://kirapo.jp/polaris/titles/sample2") {
        throw new Error("network error");
      }
      if (url === "https://kirapo.jp/ambre/titles/sample3") {
        throw new Error("network error");
      }
      const html = pages[url];
      if (!html) {
        throw new Error(`unexpected url: ${url}`);
      }
      return html;
    });

    const items = await kirapoParser.collectUrls?.(source, { fetchAllowedHtml });

    expect(items).toEqual([{ viewerUrl: "https://kirapo.jp/pt/meteor/sample1/1001/viewer" }]);
  });
});

describe("kirapo/fetchViewerDetail", () => {
  it("ビューワー URL から作品ページ URL を導出して詳細を取得する", async () => {
    const fetchAllowedHtml = vi.fn(async (url: string) => {
      expect(url).toBe("https://kirapo.jp/meteor/titles/sample1");
      return loadFixture("kirapo-title");
    });

    const detail = await kirapoParser.fetchViewerDetail?.(
      "https://kirapo.jp/pt/meteor/sample1/1001/viewer",
      { fetchAllowedHtml, fetchAllowedRenderedHtml: vi.fn() },
    );

    expect(detail?.title).toBe("サンプル読切1");
    expect(fetchAllowedHtml).toHaveBeenCalledTimes(1);
  });

  it("ビューワー URL の形式に合致しない場合は null を返す", async () => {
    const fetchAllowedHtml = vi.fn();

    const detail = await kirapoParser.fetchViewerDetail?.("https://kirapo.jp/unexpected", {
      fetchAllowedHtml,
      fetchAllowedRenderedHtml: vi.fn(),
    });

    expect(detail).toBeNull();
    expect(fetchAllowedHtml).not.toHaveBeenCalled();
  });
});

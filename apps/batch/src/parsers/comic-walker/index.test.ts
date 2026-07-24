import { describe, expect, it, vi } from "vitest";
import type { Source } from "../../config/sources.js";
import { loadFixture } from "../../test-utils/loadFixture.js";
import { comicWalkerParser } from "./index.js";

const source: Source = {
  key: "comic-walker",
  name: "カドコミ",
  listUrls: ["https://comic-walker.com/label"],
  siteUrl: "https://comic-walker.com/",
  parser: "comic-walker",
  enabled: true,
  favicon: "/favicons/comic-walker.png",
};

describe("comic-walker/parse", () => {
  it("フィクスチャから読み切りを抽出できる", () => {
    const html = loadFixture("comic-walker-oneshot");
    const items = comicWalkerParser.parse(html, source);

    expect(items).toEqual([
      { viewerUrl: "https://comic-walker.com/detail/KC_000001_S/episodes/KC_0000010000200011_E" },
      { viewerUrl: "https://comic-walker.com/detail/KC_000002_S/episodes/KC_0000020000200011_E" },
    ]);
  });
});

describe("comic-walker/collectUrls", () => {
  it("レーベル一覧を取得し、各レーベルをページネーションを辿りながら収集する", async () => {
    const pages: Record<string, string> = {
      "https://comic-walker.com/label": loadFixture("comic-walker-label"),
      "https://comic-walker.com/label/kadocomi/one-shot": loadFixture("comic-walker-oneshot"),
      "https://comic-walker.com/label/kadocomi/one-shot?p=2": loadFixture(
        "comic-walker-oneshot-page2",
      ),
      "https://comic-walker.com/label/asuka/one-shot": loadFixture("comic-walker-oneshot-single"),
    };

    const fetchAllowedHtml = vi.fn(async (url: string) => {
      const html = pages[url];
      if (!html) {
        throw new Error(`unexpected url: ${url}`);
      }
      return html;
    });

    const items = await comicWalkerParser.collectUrls?.(source, { fetchAllowedHtml });

    // 1 ページ目 → rel="next" で 2 ページ目へ、を kadocomi・asuka それぞれで辿る
    expect(items).toEqual([
      { viewerUrl: "https://comic-walker.com/detail/KC_000001_S/episodes/KC_0000010000200011_E" },
      { viewerUrl: "https://comic-walker.com/detail/KC_000002_S/episodes/KC_0000020000200011_E" },
      { viewerUrl: "https://comic-walker.com/detail/KC_000003_S/episodes/KC_0000030000200011_E" },
      { viewerUrl: "https://comic-walker.com/detail/KC_000004_S/episodes/KC_0000040000200011_E" },
    ]);
    // ページネーションの無い asuka では next ページを取りに行かない
    expect(fetchAllowedHtml).toHaveBeenCalledTimes(4);
  });

  it("1 レーベルの収集失敗が他レーベルの収集を止めない", async () => {
    const pages: Record<string, string> = {
      "https://comic-walker.com/label": loadFixture("comic-walker-label"),
      "https://comic-walker.com/label/asuka/one-shot": loadFixture("comic-walker-oneshot-single"),
    };

    const fetchAllowedHtml = vi.fn(async (url: string) => {
      if (url === "https://comic-walker.com/label/kadocomi/one-shot") {
        throw new Error("network error");
      }
      const html = pages[url];
      if (!html) {
        throw new Error(`unexpected url: ${url}`);
      }
      return html;
    });

    const items = await comicWalkerParser.collectUrls?.(source, { fetchAllowedHtml });

    expect(items).toEqual([
      { viewerUrl: "https://comic-walker.com/detail/KC_000004_S/episodes/KC_0000040000200011_E" },
    ]);
  });
});

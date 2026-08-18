import { describe, expect, it } from "vitest";
import type { Source } from "../../config/sources.js";
import { loadFixture } from "../../test-utils/loadFixture.js";
import { comicBoostParser } from "./index.js";

const source: Source = {
  key: "comic-boost",
  name: "comicブースト",
  listUrls: ["https://comic-boost.com/genre/3"],
  siteUrl: "https://comic-boost.com/",
  parser: "comic-boost",
  enabled: true,
  favicon: "/favicons/comic-boost.png",
};

describe("comic-boost", () => {
  it("フィクスチャから読み切りを抽出できる", () => {
    const html = loadFixture("comic-boost");
    const items = comicBoostParser.parse(html, source);

    // 実際の閲覧ページ（/product/{id}）ではなく、詳細を静的 HTML から取得できる
    // 作品詳細ページ（/content/{id}）を viewer URL として採用する
    expect(items).toEqual([
      { viewerUrl: "https://comic-boost.com/content/00010001" },
      { viewerUrl: "https://comic-boost.com/content/00020001" },
    ]);
  });
});

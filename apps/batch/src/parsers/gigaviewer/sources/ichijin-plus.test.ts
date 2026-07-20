import { load } from "cheerio";
import { describe, expect, it } from "vitest";
import type { Source } from "../../../config/sources.js";
import { loadFixture } from "../../../test-utils/loadFixture.js";
import { extract } from "./ichijin-plus.js";

const source: Source = {
  key: "ichijin-plus",
  name: "一迅プラス",
  listUrl: "https://ichicomi.com/series#oneshot",
  parser: "gigaviewer",
  enabled: true,
};

describe("gigaviewer/ichijin-plus", () => {
  it("フィクスチャから読み切りを抽出できる", () => {
    const $ = load(loadFixture("ichijin-plus"));
    const items = extract($, source);

    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.title.length).toBeGreaterThan(0);
      expect(item.author).not.toBeNull();
      expect(item.viewerUrl).toMatch(/^https:\/\/ichicomi\.com\/episode\/\d+$/);
      expect(item.thumbnailUrl).toMatch(/^https:\/\//);
    }
  });
});

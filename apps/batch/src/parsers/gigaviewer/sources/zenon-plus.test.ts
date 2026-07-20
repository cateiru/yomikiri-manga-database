import { load } from "cheerio";
import { describe, expect, it } from "vitest";
import type { Source } from "../../../config/sources.js";
import { loadFixture } from "../../../test-utils/loadFixture.js";
import { extract } from "./zenon-plus.js";

const source: Source = {
  key: "zenon-plus",
  name: "ゼノンプラス",
  listUrl: "https://comic-zenon.com/series/oneshot",
  parser: "gigaviewer",
  enabled: true,
};

describe("gigaviewer/zenon-plus", () => {
  it("フィクスチャから読み切りを抽出できる", () => {
    const $ = load(loadFixture("zenon-plus"));
    const items = extract($, source);

    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.title.length).toBeGreaterThan(0);
      expect(item.author).not.toBeNull();
      expect(item.viewerUrl).toMatch(/^https:\/\/comic-zenon\.com\/episode\/\d+$/);
      expect(item.thumbnailUrl).toMatch(/^https:\/\//);
    }
  });
});

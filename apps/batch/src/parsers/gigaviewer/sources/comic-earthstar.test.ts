import { load } from "cheerio";
import { describe, expect, it } from "vitest";
import type { Source } from "../../../config/sources.js";
import { loadFixture } from "../../../test-utils/loadFixture.js";
import { extract } from "./comic-earthstar.js";

const source: Source = {
  key: "comic-earthstar",
  name: "コミックアース・スター",
  listUrl: "https://comic-earthstar.com/oneshot",
  parser: "gigaviewer",
  enabled: true,
};

describe("gigaviewer/comic-earthstar", () => {
  it("フィクスチャから読み切りを抽出できる", () => {
    const $ = load(loadFixture("comic-earthstar"));
    const items = extract($, source);

    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.title.length).toBeGreaterThan(0);
      expect(item.author).not.toBeNull();
      expect(item.viewerUrl).toMatch(/^https:\/\/comic-earthstar\.com\/episode\/\d+$/);
      expect(item.thumbnailUrl).toMatch(/^https:\/\//);
    }
  });
});

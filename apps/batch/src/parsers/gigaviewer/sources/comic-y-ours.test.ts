import { load } from "cheerio";
import { describe, expect, it } from "vitest";
import type { Source } from "../../../config/sources.js";
import { loadFixture } from "../../../test-utils/loadFixture.js";
import { extract } from "./comic-y-ours.js";

const source: Source = {
  key: "comic-y-ours",
  name: "COMIC Y-OURS",
  listUrl: "https://comic-y-ours.com/series/oneshot",
  parser: "gigaviewer",
  enabled: true,
  favicon: "/favicons/comic-y-ours.png",
};

describe("gigaviewer/comic-y-ours", () => {
  it("フィクスチャから読み切りを抽出できる", () => {
    const $ = load(loadFixture("comic-y-ours"));
    const items = extract($, source);

    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.viewerUrl).toMatch(/^https:\/\/comic-y-ours\.com\/episode\/\d+$/);
    }
  });
});

import { load } from "cheerio";
import { describe, expect, it } from "vitest";
import type { Source } from "../../../config/sources.js";
import { loadFixture } from "../../../test-utils/loadFixture.js";
import { extract } from "./jump-plus.js";

const source: Source = {
  key: "jump-plus",
  name: "少年ジャンプ+",
  listUrls: ["https://shonenjumpplus.com/series/oneshot"],
  siteUrl: "https://shonenjumpplus.com/",
  parser: "gigaviewer",
  enabled: true,
  favicon: "/favicons/jump-plus.png",
};

describe("gigaviewer/jump-plus", () => {
  it("フィクスチャから読み切りを抽出できる", () => {
    const $ = load(loadFixture("jump-plus"));
    const items = extract($, source);

    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.viewerUrl).toMatch(/^https:\/\/shonenjumpplus\.com\/episode\/\d+$/);
    }
  });
});

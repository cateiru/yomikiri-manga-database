import { load } from "cheerio";
import { describe, expect, it } from "vitest";
import type { Source } from "../../../config/sources.js";
import { loadFixture } from "../../../test-utils/loadFixture.js";
import { extract } from "./kuragebunch.js";

const source: Source = {
  key: "kuragebunch",
  name: "くらげバンチ",
  listUrl: "https://kuragebunch.com/series/oneshot",
  siteUrl: "https://kuragebunch.com/",
  parser: "gigaviewer",
  enabled: true,
  favicon: "/favicons/kuragebunch.png",
};

describe("gigaviewer/kuragebunch", () => {
  it("フィクスチャから読み切りを抽出できる", () => {
    const $ = load(loadFixture("kuragebunch"));
    const items = extract($, source);

    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.viewerUrl).toMatch(/^https:\/\/kuragebunch\.com\/episode\/\d+$/);
    }
  });
});

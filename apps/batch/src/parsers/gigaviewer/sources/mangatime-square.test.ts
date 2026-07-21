import { load } from "cheerio";
import { describe, expect, it } from "vitest";
import type { Source } from "../../../config/sources.js";
import { loadFixture } from "../../../test-utils/loadFixture.js";
import { extract } from "./mangatime-square.js";

const source: Source = {
  key: "mangatime-square",
  name: "まんがタイムスクエア",
  listUrl: "https://mangatime-square.com/series#extra",
  siteUrl: "https://mangatime-square.com/",
  parser: "gigaviewer",
  enabled: true,
  favicon: "/favicons/mangatime-square.png",
};

describe("gigaviewer/mangatime-square", () => {
  it("フィクスチャから読み切りを抽出できる", () => {
    const $ = load(loadFixture("mangatime-square"));
    const items = extract($, source);

    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.viewerUrl).toMatch(/^https:\/\/mangatime-square\.com\/episode\/\d+$/);
    }
  });
});

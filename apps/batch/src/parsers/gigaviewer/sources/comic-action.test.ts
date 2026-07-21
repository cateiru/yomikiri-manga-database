import { load } from "cheerio";
import { describe, expect, it } from "vitest";
import type { Source } from "../../../config/sources.js";
import { loadFixture } from "../../../test-utils/loadFixture.js";
import { extract } from "./comic-action.js";

const source: Source = {
  key: "comic-action",
  name: "コミックアクション",
  listUrl: "https://comic-action.com/series/oneshot",
  siteUrl: "https://comic-action.com/",
  parser: "gigaviewer",
  enabled: true,
  favicon: "/favicons/comic-action.png",
};

describe("gigaviewer/comic-action", () => {
  it("フィクスチャから読み切りを抽出できる", () => {
    const $ = load(loadFixture("comic-action"));
    const items = extract($, source);

    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.viewerUrl).toMatch(/^https:\/\/comic-action\.com\/episode\/\d+$/);
    }
  });
});

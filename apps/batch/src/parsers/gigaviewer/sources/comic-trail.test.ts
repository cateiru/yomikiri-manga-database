import { load } from "cheerio";
import { describe, expect, it } from "vitest";
import type { Source } from "../../../config/sources.js";
import { loadFixture } from "../../../test-utils/loadFixture.js";
import { extract } from "./comic-trail.js";

const source: Source = {
  key: "comic-trail",
  name: "コミックトレイル",
  listUrl: "https://comic-trail.com/series#oneshot",
  siteUrl: "https://comic-trail.com/",
  parser: "gigaviewer",
  enabled: true,
  favicon: "/favicons/comic-trail.png",
};

describe("gigaviewer/comic-trail", () => {
  it("フィクスチャから読み切りを抽出できる", () => {
    const $ = load(loadFixture("comic-trail"));
    const items = extract($, source);

    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.viewerUrl).toMatch(/^https:\/\/comic-trail\.com\/episode\/\d+$/);
    }
  });
});

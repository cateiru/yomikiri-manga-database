import { load } from "cheerio";
import { describe, expect, it } from "vitest";
import type { Source } from "../../../config/sources.js";
import { loadFixture } from "../../../test-utils/loadFixture.js";
import { extract } from "./comic-days.js";

const source: Source = {
  key: "comic-days",
  name: "コミックDAYS",
  listUrl: "https://comic-days.com/oneshot",
  siteUrl: "https://comic-days.com/",
  parser: "gigaviewer",
  enabled: true,
  favicon: "/favicons/comic-days.png",
};

describe("gigaviewer/comic-days", () => {
  it("フィクスチャから読み切りを抽出できる", () => {
    const $ = load(loadFixture("comic-days"));
    const items = extract($, source);

    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.viewerUrl).toMatch(/^https:\/\/comic-days\.com\/episode\/\d+$/);
    }
  });
});

import { load } from "cheerio";
import { describe, expect, it } from "vitest";
import type { Source } from "../../../config/sources.js";
import { loadFixture } from "../../../test-utils/loadFixture.js";
import { extract } from "./comic-earthstar.js";

const source: Source = {
  key: "comic-earthstar",
  name: "コミックアース・スター",
  listUrls: ["https://comic-earthstar.com/oneshot"],
  siteUrl: "https://comic-earthstar.com/",
  parser: "gigaviewer",
  enabled: true,
  favicon: "/favicons/comic-earthstar.png",
};

describe("gigaviewer/comic-earthstar", () => {
  it("フィクスチャから読み切りを抽出できる", () => {
    const $ = load(loadFixture("comic-earthstar"));
    const items = extract($, source);

    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.viewerUrl).toMatch(/^https:\/\/comic-earthstar\.com\/episode\/\d+$/);
    }
  });
});

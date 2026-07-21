import { load } from "cheerio";
import { describe, expect, it } from "vitest";
import type { Source } from "../../../config/sources.js";
import { loadFixture } from "../../../test-utils/loadFixture.js";
import { extract } from "./morning-two.js";

const source: Source = {
  key: "morning-two",
  name: "モーニング・ツー",
  listUrls: ["https://morningtwo.com/series#%E8%AA%AD%E3%81%BF%E5%88%87%E3%82%8A"],
  siteUrl: "https://morningtwo.com/",
  parser: "gigaviewer",
  enabled: true,
  favicon: "/favicons/morning-two.png",
  fallbackSourceKey: "comic-days",
};

describe("gigaviewer/morning-two", () => {
  it("フィクスチャから読み切りを抽出できる", () => {
    const $ = load(loadFixture("morning-two"));
    const items = extract($, source);

    expect(items.length).toBe(3);
    for (const item of items) {
      expect(item.viewerUrl).toMatch(/^https:\/\/comic-days\.com\/episode\/\d+\?from=morningtwo$/);
    }
  });
});

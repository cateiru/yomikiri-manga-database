import { load } from "cheerio";
import { describe, expect, it } from "vitest";
import type { Source } from "../../../config/sources.js";
import { loadFixture } from "../../../test-utils/loadFixture.js";
import { extract } from "./getsumagakichi.js";

const source: Source = {
  key: "getsumagakichi",
  name: "月マガ基地",
  listUrl: "https://getsumagakichi.com/series/oneshot_newcomer",
  siteUrl: "https://getsumagakichi.com/",
  parser: "gigaviewer",
  enabled: true,
  favicon: "/favicons/getsumagakichi.png",
  fallbackSourceKey: "comic-days",
};

describe("gigaviewer/getsumagakichi", () => {
  it("読切・新人漫画賞受賞作品の両方から読み切りを抽出できる", () => {
    const $ = load(loadFixture("getsumagakichi"));
    const items = extract($, source);

    expect(items.length).toBe(3);
    for (const item of items) {
      expect(item.viewerUrl).toMatch(/^https:\/\/comic-days\.com\/episode\/\d+\?from=gmagakichi$/);
    }
  });
});

import { load } from "cheerio";
import { describe, expect, it } from "vitest";
import type { Source } from "../../../config/sources.js";
import { loadFixture } from "../../../test-utils/loadFixture.js";
import { extract } from "./sunday-webry.js";

const source: Source = {
  key: "sunday-webry",
  name: "サンデーうぇぶり",
  listUrl: "https://www.sunday-webry.com/series/oneshot",
  parser: "gigaviewer",
  enabled: true,
};

describe("gigaviewer/sunday-webry", () => {
  it("フィクスチャから読み切りを抽出できる", () => {
    const $ = load(loadFixture("sunday-webry"));
    const items = extract($, source);

    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.title.length).toBeGreaterThan(0);
      expect(item.author).not.toBeNull();
      expect(item.viewerUrl).toMatch(/^https:\/\/www\.sunday-webry\.com\/episode\/\d+$/);
      expect(item.thumbnailUrl).toMatch(/^https:\/\//);
    }
  });
});

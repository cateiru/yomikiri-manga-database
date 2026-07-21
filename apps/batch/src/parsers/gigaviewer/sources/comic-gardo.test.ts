import { load } from "cheerio";
import { describe, expect, it } from "vitest";
import type { Source } from "../../../config/sources.js";
import { loadFixture } from "../../../test-utils/loadFixture.js";
import { extract } from "./comic-gardo.js";

const source: Source = {
  key: "comic-gardo",
  name: "コミックガルド",
  listUrls: ["https://comic-gardo.com/series/oneshot"],
  siteUrl: "https://comic-gardo.com/",
  parser: "gigaviewer",
  enabled: true,
  favicon: "/favicons/comic-gardo.png",
};

describe("gigaviewer/comic-gardo", () => {
  it("読切セクションが空の場合はクラッシュせず空配列を返す", () => {
    // フィクスチャ取得時点で #oneshot セクションに掲載作品が無かったため、
    // このフィクスチャは実際の HTML 構造をそのまま反映した「0 件」の状態になっている。
    const $ = load(loadFixture("comic-gardo"));
    const items = extract($, source);

    expect(items).toEqual([]);
  });
});

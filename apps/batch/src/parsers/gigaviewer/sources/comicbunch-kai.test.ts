import { load } from "cheerio";
import { describe, expect, it } from "vitest";
import type { Source } from "../../../config/sources.js";
import { loadFixture } from "../../../test-utils/loadFixture.js";
import { extract } from "./comicbunch-kai.js";

const source: Source = {
  key: "comicbunch-kai",
  name: "コミックバンチKai",
  listUrls: ["https://comicbunch-kai.com/series#oneshot"],
  siteUrl: "https://comicbunch-kai.com/",
  parser: "gigaviewer",
  enabled: true,
  favicon: "/favicons/comicbunch-kai.png",
  fallbackSourceKey: "kuragebunch",
};

describe("gigaviewer/comicbunch-kai", () => {
  it("読切セクションのみから読み切りを抽出できる（連載作品は含まない）", () => {
    const $ = load(loadFixture("comicbunch-kai"));
    const items = extract($, source);

    expect(items.length).toBe(2);
    for (const item of items) {
      expect(item.viewerUrl).toMatch(
        /^https:\/\/kuragebunch\.com\/episode\/\d+\?from=comicbunchkai$/,
      );
    }
  });
});

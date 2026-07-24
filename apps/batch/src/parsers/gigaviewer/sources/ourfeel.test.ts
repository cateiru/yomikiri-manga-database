import { load } from "cheerio";
import { describe, expect, it } from "vitest";
import type { Source } from "../../../config/sources.js";
import { loadFixture } from "../../../test-utils/loadFixture.js";
import { extract } from "./ourfeel.js";

const source: Source = {
  key: "ourfeel",
  name: "OUR FEEL",
  listUrls: ["https://ourfeel.jp/"],
  siteUrl: "https://ourfeel.jp/",
  parser: "gigaviewer",
  enabled: true,
  favicon: "/favicons/ourfeel.png",
};

describe("gigaviewer/ourfeel", () => {
  it("読切セクションのみから抽出し、出張掲載・終了作品は除外する", () => {
    const $ = load(loadFixture("ourfeel"));
    const items = extract($, source);

    expect(items).toEqual([
      { viewerUrl: "https://ourfeel.jp/episode/1000000000000000001" },
      { viewerUrl: "https://ourfeel.jp/episode/1000000000000000002" },
    ]);
  });
});

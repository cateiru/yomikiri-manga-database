import { load } from "cheerio";
import { describe, expect, it } from "vitest";
import type { Source } from "../../../config/sources.js";
import { loadFixture } from "../../../test-utils/loadFixture.js";
import { extract } from "./tonarinoyj.js";

const source: Source = {
  key: "tonarinoyj",
  name: "となりのヤングジャンプ",
  listUrl: "https://tonarinoyj.jp/series/oneshot",
  parser: "gigaviewer",
  enabled: true,
  favicon: "/favicons/tonarinoyj.png",
};

describe("gigaviewer/tonarinoyj", () => {
  it("フィクスチャから読み切りを抽出できる", () => {
    const $ = load(loadFixture("tonarinoyj"));
    const items = extract($, source);

    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.viewerUrl).toMatch(/^https:\/\/tonarinoyj\.jp\/episode\/\d+$/);
    }
  });
});

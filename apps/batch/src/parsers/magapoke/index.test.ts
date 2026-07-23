import { describe, expect, it } from "vitest";
import type { Source } from "../../config/sources.js";
import { loadFixture } from "../../test-utils/loadFixture.js";
import { magapokeParser } from "./index.js";

const source: Source = {
  key: "magapoke",
  name: "マガポケ",
  listUrls: ["https://pocket.shonenmagazine.com/search/genre/10"],
  siteUrl: "https://pocket.shonenmagazine.com/",
  parser: "magapoke",
  enabled: true,
  favicon: "/favicons/magapoke.png",
};

describe("magapoke", () => {
  it("フィクスチャから読み切りを抽出できる", () => {
    const html = loadFixture("magapoke");
    const items = magapokeParser.parse(html, source);

    // 複数話にまたがる作品（2件目）でも「はじめから読む」のリンクを採用する
    expect(items).toEqual([
      { viewerUrl: "https://pocket.shonenmagazine.com/title/00001/episode/100001" },
      { viewerUrl: "https://pocket.shonenmagazine.com/title/00002/episode/100010" },
    ]);
  });
});

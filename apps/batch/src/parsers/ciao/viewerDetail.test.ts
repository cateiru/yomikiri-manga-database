import * as cheerio from "cheerio";
import { describe, expect, it } from "vitest";
import { loadFixture } from "../../test-utils/loadFixture.js";
import { extractViewerDetail } from "./viewerDetail.js";

describe("ciao/viewerDetail", () => {
  it("フィクスチャからタイトル・著者・サムネイル・掲載日を抽出できる", () => {
    const html = loadFixture("ciao-episode");
    const $ = cheerio.load(html);

    const detail = extractViewerDetail(
      $,
      "https://ciao.shogakukan.co.jp/comics/title/00286/episode/07309",
    );

    expect(detail).toEqual({
      title: "サンプル読切1",
      author: "サンプル作者",
      thumbnailUrl:
        "https://cdn.ciao.shogakukan.co.jp/static/titles/286/episodes/7309/thumbnail.jpg",
      publishedAt: new Date(Date.UTC(2023, 7, 10)),
      year: 2023,
    });
  });

  it("__NUXT_DATA__ が存在しない場合は null を返す", () => {
    const $ = cheerio.load("<html><body></body></html>");
    expect(extractViewerDetail($, "https://ciao.shogakukan.co.jp/")).toBeNull();
  });
});

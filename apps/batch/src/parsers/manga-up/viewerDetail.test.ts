import * as cheerio from "cheerio";
import { describe, expect, it } from "vitest";
import { loadFixture } from "../../test-utils/loadFixture.js";
import { extractViewerDetail } from "./viewerDetail.js";

describe("manga-up/viewerDetail", () => {
  it("フィクスチャからタイトル・著者・サムネイルを抽出できる（掲載日は取得不可のため null）", () => {
    const html = loadFixture("manga-up-viewer");
    const $ = cheerio.load(html);

    const detail = extractViewerDetail($, "https://www.manga-up.com/titles/1018/chapters/75505");

    expect(detail).toEqual({
      title: "電気うなぎ少女",
      author: "山﨑千裕",
      thumbnailUrl:
        "https://ja-img.manga-up.com/secure/1544469945/chapter/180000000_1.webp?hash=-hRY4DqrzJEIhKcTZCd0sA&expires=2145884400",
      publishedAt: null,
      year: null,
    });
  });

  it("ComicSeries の ld+json が存在しない場合は null を返す", () => {
    const $ = cheerio.load("<html><body></body></html>");
    expect(extractViewerDetail($, "https://www.manga-up.com/")).toBeNull();
  });
});

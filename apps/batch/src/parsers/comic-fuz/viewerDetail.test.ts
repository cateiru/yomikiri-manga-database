import * as cheerio from "cheerio";
import { describe, expect, it } from "vitest";
import { loadFixture } from "../../test-utils/loadFixture.js";
import { extractViewerDetail } from "./viewerDetail.js";

describe("comic-fuz/extractViewerDetail", () => {
  it("__NEXT_DATA__ からタイトル・著者・サムネイル・掲載日を抽出する", () => {
    const html = loadFixture("comic-fuz-viewer");
    const $ = cheerio.load(html);

    const detail = extractViewerDetail($, "https://comic-fuz.com/manga/10001");

    expect(detail).toEqual({
      title: "サンプル読切1",
      author: "サンプル作者",
      thumbnailUrl: "https://img.comic-fuz.com/c/sample/thumbnail.webp?h=sampleHash&e=5000000000",
      publishedAt: new Date(Date.UTC(2020, 7, 11)),
      year: 2020,
    });
  });

  it("複数話にまたがる特設ページ（受賞作まとめ等）は抽出失敗として扱う", () => {
    const html = loadFixture("comic-fuz-viewer-anthology");
    const $ = cheerio.load(html);

    const detail = extractViewerDetail($, "https://comic-fuz.com/manga/10003");

    expect(detail).toBeNull();
  });

  it("__NEXT_DATA__ が存在しない場合は null を返す", () => {
    const $ = cheerio.load("<html><body></body></html>");

    const detail = extractViewerDetail($, "https://comic-fuz.com/manga/9999");

    expect(detail).toBeNull();
  });
});

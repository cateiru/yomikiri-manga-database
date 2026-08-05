import * as cheerio from "cheerio";
import { describe, expect, it } from "vitest";
import { loadFixture } from "../../test-utils/loadFixture.js";
import { extractViewerDetail } from "./viewerDetail.js";

describe("manga-one/viewerDetail", () => {
  it("フィクスチャからタイトル・著者・サムネイル・掲載日を抽出できる", () => {
    const html = loadFixture("manga-one-viewer");
    const $ = cheerio.load(html);

    const detail = extractViewerDetail($, "https://manga-one.com/manga/26349/chapter/274584");

    expect(detail).toEqual({
      title: "ハートクラッシュ",
      author: "ぱらり",
      thumbnailUrl:
        "https://app.manga-one.com/secure/1732517183/webp/chapter/274584.webp?hash=IIr-4Zm11_S1NC6x5slm0w&expires=1872374400",
      publishedAt: new Date(Date.UTC(2024, 11, 4)),
      year: 2024,
    });
  });

  it("header h1 が存在しない場合は null を返す", () => {
    const $ = cheerio.load("<html><body></body></html>");
    expect(extractViewerDetail($, "https://manga-one.com/")).toBeNull();
  });
});

import { load } from "cheerio";
import { describe, expect, it } from "vitest";
import { loadFixture } from "../../test-utils/loadFixture.js";
import { extractViewerDetail } from "./viewerDetail.js";

const viewerUrl = "https://shonenjumpplus.com/episode/9253191255348929593";

describe("gigaviewer/viewerDetail", () => {
  it("ビューワーページから詳細を抽出できる", () => {
    const $ = load(loadFixture("gigaviewer-viewer"));
    const detail = extractViewerDetail($, viewerUrl);

    expect(detail).not.toBeNull();
    expect(detail?.title).toBe("アナーキーな新学期！");
    expect(detail?.author).toBe("小串カズ");
    expect(detail?.thumbnailUrl).toMatch(/^https:\/\//);
    expect(detail?.publishedAt?.toISOString()).toBe("2026-07-13T00:00:00.000Z");
    expect(detail?.year).toBe(2026);
  });

  it("タイトルが取得できない場合は null を返す", () => {
    const $ = load("<html><body></body></html>");
    const detail = extractViewerDetail($, viewerUrl);

    expect(detail).toBeNull();
  });
});

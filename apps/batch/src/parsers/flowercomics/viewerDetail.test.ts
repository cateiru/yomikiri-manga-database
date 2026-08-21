import { load } from "cheerio";
import { describe, expect, it } from "vitest";
import { loadFixture } from "../../test-utils/loadFixture.js";
import { extractViewerDetail } from "./viewerDetail.js";

describe("flowercomics/viewerDetail", () => {
  it("フィクスチャから詳細を抽出できる", () => {
    const $ = load(loadFixture("flowercomics-viewer"));
    const detail = extractViewerDetail($, "https://flowercomics.jp/chapter/90101");

    expect(detail).not.toBeNull();
    expect(detail?.title).toBe("サンプル読切2");
    expect(detail?.author).toBe("サンプル作者2");
    expect(detail?.thumbnailUrl).toBe(
      "https://img.flowercomics.jp/chapter/90101.webp?h=sample&e=1787443200",
    );
    // 話一覧の先頭要素（90102、2026/02/02）ではなく、URL 中の chapter id（90101）
    // に一致する話自身の掲載日（2026/02/01）を採ることを確認する
    expect(detail?.publishedAt?.toISOString()).toBe("2026-02-01T00:00:00.000Z");
    expect(detail?.year).toBe(2026);
  });

  it("titleName が抽出できない場合は null を返す", () => {
    const $ = load("<html><body></body></html>");
    const detail = extractViewerDetail($, "https://flowercomics.jp/chapter/90101");

    expect(detail).toBeNull();
  });

  it("自分自身の話が話一覧から見つからない場合は publishedAt / year が null になる", () => {
    const $ = load(loadFixture("flowercomics-viewer"));
    const detail = extractViewerDetail($, "https://flowercomics.jp/chapter/99999");

    expect(detail?.title).toBe("サンプル読切2");
    expect(detail?.publishedAt).toBeNull();
    expect(detail?.year).toBeNull();
  });
});

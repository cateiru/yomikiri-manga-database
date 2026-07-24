import { load } from "cheerio";
import { describe, expect, it } from "vitest";
import { loadFixture } from "../../test-utils/loadFixture.js";
import { extractViewerDetail } from "./viewerDetail.js";

const viewerUrl = "https://championcross.jp/episodes/xxx111";

describe("comici/viewerDetail", () => {
  it("フィクスチャから詳細を抽出できる", () => {
    const $ = load(loadFixture("comici-viewer"));
    const detail = extractViewerDetail($, viewerUrl);

    expect(detail).not.toBeNull();
    expect(detail?.title).toBe("サンプル読切1／読み切り");
    expect(detail?.author).toBe("サンプル作者1");
    expect(detail?.thumbnailUrl).toBe("https://cdn-public.comici.jp/episode/123/sample.webp");
    expect(detail?.publishedAt?.toISOString()).toBe("2026-06-29T00:00:00.000Z");
    expect(detail?.year).toBe(2026);
  });

  it("シリーズタイトルが無い場合は null を返す", () => {
    const $ = load("<html><body></body></html>");
    const detail = extractViewerDetail($, viewerUrl);

    expect(detail).toBeNull();
  });

  it("掲載日が抽出できない場合は publishedAt / year が null になる", () => {
    const $ = load(`
      <html>
      <body>
        <a data-e2e="ehSeriesLnk">サンプル読切1／読み切り</a>
      </body>
      </html>
    `);
    const detail = extractViewerDetail($, viewerUrl);

    expect(detail?.title).toBe("サンプル読切1／読み切り");
    expect(detail?.publishedAt).toBeNull();
    expect(detail?.year).toBeNull();
  });
});

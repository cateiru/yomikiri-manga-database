import { load } from "cheerio";
import { describe, expect, it } from "vitest";
import { loadFixture } from "../../test-utils/loadFixture.js";
import { extractViewerDetail } from "./viewerDetail.js";

describe("kirapo/viewerDetail", () => {
  it("単一話の作品ページから詳細を抽出できる", () => {
    const $ = load(loadFixture("kirapo-title"));
    const detail = extractViewerDetail($, "https://kirapo.jp/pt/meteor/sample1/1001/viewer");

    expect(detail).not.toBeNull();
    expect(detail?.title).toBe("サンプル読切1");
    expect(detail?.author).toBe("サンプル作者1");
    expect(detail?.thumbnailUrl).toBe("https://kirapo.jp/storage/images/title/1/ogp_a.jpg");
    expect(detail?.publishedAt?.toISOString()).toBe("2026-08-19T00:00:00.000Z");
    expect(detail?.year).toBe(2026);
  });

  it("複数著者（原作・漫画等）はラベルを除いて連結する", () => {
    const $ = load(loadFixture("kirapo-title-multi"));
    const detail = extractViewerDetail($, "https://kirapo.jp/pt/polaris/sample2/2101/viewer");

    expect(detail?.title).toBe("サンプル読切2");
    expect(detail?.author).toBe("サンプル作画者、サンプル原作者");
    // .last-update は作品ページ全体（＝最新話）の更新日であり、渡した viewerUrl
    // （第1話 2101）自身の掲載日ではない点に注意（viewerDetail.ts のコメント参照）
    expect(detail?.publishedAt?.toISOString()).toBe("2026-02-02T00:00:00.000Z");
  });

  it("h2 が見つからない場合は null を返す", () => {
    const $ = load("<html><body></body></html>");
    const detail = extractViewerDetail($, "https://kirapo.jp/pt/meteor/sample1/1001/viewer");

    expect(detail).toBeNull();
  });
});

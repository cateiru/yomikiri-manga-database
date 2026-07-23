import { load } from "cheerio";
import { describe, expect, it } from "vitest";
import { loadFixture } from "../../test-utils/loadFixture.js";
import { extractViewerDetail } from "./viewerDetail.js";

const viewerUrl = "https://pocket.shonenmagazine.com/title/00001/episode/100001";

describe("magapoke/viewerDetail", () => {
  it("ビューワーページから詳細を抽出できる", () => {
    const $ = load(loadFixture("magapoke-viewer"));
    const detail = extractViewerDetail($, viewerUrl);

    expect(detail).not.toBeNull();
    expect(detail?.title).toBe("サンプル作品1");
    expect(detail?.author).toBe("サンプル作者1");
    expect(detail?.thumbnailUrl).toBe(
      "https://mgpk-cdn.magazinepocket.com/static/titles/1/banner.png",
    );
    expect(detail?.publishedAt?.toISOString()).toBe("2026-07-08T00:00:00.000Z");
    expect(detail?.year).toBe(2026);
  });

  it("meta[name=thumbnail] が無い場合は og:image にフォールバックする", () => {
    const $ = load(`
      <meta property="og:image" content="https://example.com/og.png">
      <h1 class="p-episode__comic-ttl">タイトル</h1>
    `);
    const detail = extractViewerDetail($, viewerUrl);

    expect(detail?.thumbnailUrl).toBe("https://example.com/og.png");
  });

  it("タイトルが取得できない場合は null を返す", () => {
    const $ = load("<html><body></body></html>");
    const detail = extractViewerDetail($, viewerUrl);

    expect(detail).toBeNull();
  });
});

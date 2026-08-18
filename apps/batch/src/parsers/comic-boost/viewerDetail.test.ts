import { load } from "cheerio";
import { describe, expect, it } from "vitest";
import { loadFixture } from "../../test-utils/loadFixture.js";
import { extractViewerDetail } from "./viewerDetail.js";

const viewerUrl = "https://comic-boost.com/content/00010001";

describe("comic-boost/viewerDetail", () => {
  it("作品詳細ページから詳細を抽出できる", () => {
    const $ = load(loadFixture("comic-boost-viewer"));
    const detail = extractViewerDetail($, viewerUrl);

    expect(detail).not.toBeNull();
    expect(detail?.title).toBe("サンプル作品1");
    expect(detail?.author).toBe("サンプル作者1");
    expect(detail?.thumbnailUrl).toBe("https://example.com/thum/00010001_kv.jpg");
    expect(detail?.publishedAt?.toISOString()).toBe("2026-05-15T00:00:00.000Z");
    expect(detail?.year).toBe(2026);
  });

  it("複数著者はどちらも読点区切りで結合する", () => {
    const $ = load(`
      <div class="comic-main-right">
        <h1 class="comic-title">タイトル</h1>
        <ul class="author-list">
          <li class="author">原作：<a href="/author/a">著者A</a></li>
          <li class="author">作画：<a href="/author/b">著者B</a></li>
        </ul>
      </div>
      <a class="book-product-list-item"></a>
    `);
    const detail = extractViewerDetail($, viewerUrl);

    expect(detail?.author).toBe("著者A、著者B");
  });

  it("本編とは別枠の「よく読まれている作品」等の author-list は無視する", () => {
    const $ = load(`
      <div class="comic-main-right">
        <h1 class="comic-title">タイトル</h1>
        <ul class="author-list">
          <li class="author"><a href="/author/main">本編の作者</a></li>
        </ul>
      </div>
      <a class="book-product-list-item"></a>
      <div class="book-list-item">
        <ul class="author-list">
          <li class="author"><a href="/author/other">別の作者</a></li>
        </ul>
      </div>
    `);
    const detail = extractViewerDetail($, viewerUrl);

    expect(detail?.author).toBe("本編の作者");
  });

  it("話数が複数（連作まとめページ）の場合は null を返す", () => {
    const $ = load(`
      <h1 class="comic-title">【8P読切企画】まとめ</h1>
      <a class="book-product-list-item"></a>
      <a class="book-product-list-item"></a>
    `);
    const detail = extractViewerDetail($, viewerUrl);

    expect(detail).toBeNull();
  });

  it("サムネイルが無い場合は og:image にフォールバックする", () => {
    const $ = load(`
      <meta property="og:image" content="https://example.com/og.png">
      <h1 class="comic-title">タイトル</h1>
      <a class="book-product-list-item"></a>
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

import { load } from "cheerio";
import { describe, expect, it } from "vitest";
import { loadFixture } from "../../test-utils/loadFixture.js";
import { extractViewerDetail } from "./viewerDetail.js";

const viewerUrl = "https://comic-walker.com/detail/KC_000001_S/episodes/KC_0000010000200011_E";

describe("comic-walker/viewerDetail", () => {
  it("__NEXT_DATA__ から詳細を抽出できる", () => {
    const $ = load(loadFixture("comic-walker-viewer"));
    const detail = extractViewerDetail($, viewerUrl);

    expect(detail).not.toBeNull();
    expect(detail?.title).toBe("サンプル読切1");
    expect(detail?.author).toBe("サンプル作者1");
    expect(detail?.thumbnailUrl).toBe("https://cdn.comic-walker.com/sample/thumbnail.jpg");
    expect(detail?.publishedAt?.toISOString()).toBe("2026-07-08T02:00:00.000Z");
    expect(detail?.year).toBe(2026);
  });

  it("__NEXT_DATA__ が無い場合は null を返す", () => {
    const $ = load("<html><body></body></html>");
    const detail = extractViewerDetail($, viewerUrl);

    expect(detail).toBeNull();
  });

  it("__NEXT_DATA__ が不正な JSON の場合は null を返す", () => {
    const $ = load(`<script id="__NEXT_DATA__" type="application/json">{invalid</script>`);
    const detail = extractViewerDetail($, viewerUrl);

    expect(detail).toBeNull();
  });

  it("work.title が無い場合は null を返す", () => {
    const $ = load(`
      <script id="__NEXT_DATA__" type="application/json">
      {
        "props": {
          "pageProps": {
            "dehydratedState": {
              "queries": [
                {
                  "queryKey": ["/api/contents/details/work", {}],
                  "state": { "data": { "work": {} } }
                }
              ]
            }
          }
        }
      }
      </script>
    `);
    const detail = extractViewerDetail($, viewerUrl);

    expect(detail).toBeNull();
  });

  it("authors に「著者」役割が無い場合は先頭の著者名を使う", () => {
    const $ = load(`
      <script id="__NEXT_DATA__" type="application/json">
      {
        "props": {
          "pageProps": {
            "dehydratedState": {
              "queries": [
                {
                  "queryKey": ["/api/contents/details/work", {}],
                  "state": {
                    "data": {
                      "work": {
                        "title": "タイトル",
                        "authors": [{ "name": "原作者", "role": "原作" }]
                      }
                    }
                  }
                }
              ]
            }
          }
        }
      }
      </script>
    `);
    const detail = extractViewerDetail($, viewerUrl);

    expect(detail?.author).toBe("原作者");
  });
});

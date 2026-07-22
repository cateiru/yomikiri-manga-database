import type { Db } from "@yomikiri/db/client-node";
import { describe, expect, it, vi } from "vitest";
import type { Source } from "../config/sources.js";
import * as upsert from "../db/upsert.js";
import { fetchDetails } from "./fetchDetails.js";
import * as fetchHtmlModule from "./fetchHtml.js";
import { HttpError } from "./fetchHtml.js";
import * as robotsModule from "./robots.js";

function buildSource(key: string): Source {
  return {
    key,
    name: key,
    listUrls: [`https://${key}.example.com/oneshot`],
    siteUrl: `https://${key}.example.com/`,
    parser: "gigaviewer",
    enabled: true,
    favicon: `/favicons/${key}.png`,
  };
}

const VIEWER_HTML = `<div class="series-header-title">タイトル</div>`;

describe("fetchDetails のレート制限", () => {
  it("同一ソースへの連続アクセスは 1 秒以上間隔を空ける", async () => {
    vi.spyOn(upsert, "getUnfetchedOneshots").mockResolvedValue([
      { id: 1, sourceKey: "source-a", viewerUrl: "https://source-a.example.com/episode/1" },
      { id: 2, sourceKey: "source-a", viewerUrl: "https://source-a.example.com/episode/2" },
      { id: 3, sourceKey: "source-a", viewerUrl: "https://source-a.example.com/episode/3" },
    ]);
    vi.spyOn(upsert, "updateOneshotDetail").mockResolvedValue(undefined);
    vi.spyOn(robotsModule, "fetchRobotsRules").mockResolvedValue({ isAllowed: () => true });

    const callTimestamps: number[] = [];
    vi.spyOn(fetchHtmlModule, "fetchHtml").mockImplementation(async () => {
      callTimestamps.push(Date.now());
      return VIEWER_HTML;
    });

    await fetchDetails({} as Db, [buildSource("source-a")]);

    expect(callTimestamps).toHaveLength(3);
    let previous: number | undefined;
    for (const timestamp of callTimestamps) {
      if (previous !== undefined) {
        expect(timestamp - previous).toBeGreaterThanOrEqual(1000);
      }
      previous = timestamp;
    }
  }, 10000);

  it("異なるソースへのアクセスは互いに待ち合わせない（source ごとに独立してレート制限する）", async () => {
    vi.spyOn(upsert, "getUnfetchedOneshots").mockResolvedValue([
      { id: 1, sourceKey: "source-a", viewerUrl: "https://source-a.example.com/episode/1" },
      { id: 2, sourceKey: "source-b", viewerUrl: "https://source-b.example.com/episode/1" },
    ]);
    vi.spyOn(upsert, "updateOneshotDetail").mockResolvedValue(undefined);
    vi.spyOn(robotsModule, "fetchRobotsRules").mockResolvedValue({ isAllowed: () => true });

    const callTimestamps: number[] = [];
    vi.spyOn(fetchHtmlModule, "fetchHtml").mockImplementation(async () => {
      callTimestamps.push(Date.now());
      return VIEWER_HTML;
    });

    const start = Date.now();
    await fetchDetails({} as Db, [buildSource("source-a"), buildSource("source-b")]);
    const elapsed = Date.now() - start;

    expect(callTimestamps).toHaveLength(2);
    // 別ソースへの 1 件ずつのアクセスなので、待機なしでほぼ即座に終わるはず
    expect(elapsed).toBeLessThan(1000);
  });
});

describe("fetchDetails の HTTP エラーハンドリング", () => {
  it("404 の場合は detailsFetchedAt を更新（無限リトライ防止）し、result.error には積まない", async () => {
    vi.spyOn(upsert, "getUnfetchedOneshots").mockResolvedValue([
      { id: 1, sourceKey: "source-a", viewerUrl: "https://source-a.example.com/episode/1" },
    ]);
    const markDetailsFetchFailed = vi
      .spyOn(upsert, "markDetailsFetchFailed")
      .mockResolvedValue(undefined);
    vi.spyOn(robotsModule, "fetchRobotsRules").mockResolvedValue({ isAllowed: () => true });
    vi.spyOn(fetchHtmlModule, "fetchHtml").mockRejectedValue(new HttpError(404, "Not Found"));

    const results = await fetchDetails({} as Db, [buildSource("source-a")]);

    expect(markDetailsFetchFailed).toHaveBeenCalledWith({}, 1);
    expect(results).toEqual([
      { sourceKey: "source-a", attempted: 1, fetched: 0, failed: 1, error: null },
    ]);
  });

  it("410 の場合も 404 と同様に恒久的なエラーとして扱う", async () => {
    vi.spyOn(upsert, "getUnfetchedOneshots").mockResolvedValue([
      { id: 1, sourceKey: "source-a", viewerUrl: "https://source-a.example.com/episode/1" },
    ]);
    const markDetailsFetchFailed = vi
      .spyOn(upsert, "markDetailsFetchFailed")
      .mockResolvedValue(undefined);
    vi.spyOn(robotsModule, "fetchRobotsRules").mockResolvedValue({ isAllowed: () => true });
    vi.spyOn(fetchHtmlModule, "fetchHtml").mockRejectedValue(new HttpError(410, "Gone"));

    const results = await fetchDetails({} as Db, [buildSource("source-a")]);

    expect(markDetailsFetchFailed).toHaveBeenCalledWith({}, 1);
    expect(results).toEqual([
      { sourceKey: "source-a", attempted: 1, fetched: 0, failed: 1, error: null },
    ]);
  });

  it("5xx やネットワークエラーの場合は detailsFetchedAt を更新せず、result.error に記録してリトライ対象として残す", async () => {
    vi.spyOn(upsert, "getUnfetchedOneshots").mockResolvedValue([
      { id: 1, sourceKey: "source-a", viewerUrl: "https://source-a.example.com/episode/1" },
    ]);
    const markDetailsFetchFailed = vi
      .spyOn(upsert, "markDetailsFetchFailed")
      .mockResolvedValue(undefined);
    vi.spyOn(robotsModule, "fetchRobotsRules").mockResolvedValue({ isAllowed: () => true });
    vi.spyOn(fetchHtmlModule, "fetchHtml").mockRejectedValue(
      new HttpError(503, "Service Unavailable"),
    );

    const results = await fetchDetails({} as Db, [buildSource("source-a")]);

    expect(markDetailsFetchFailed).not.toHaveBeenCalled();
    expect(results).toEqual([
      {
        sourceKey: "source-a",
        attempted: 1,
        fetched: 0,
        failed: 0,
        error: "HTTP 503 Service Unavailable",
      },
    ]);
  });
});

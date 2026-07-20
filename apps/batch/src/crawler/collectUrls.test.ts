import type { Db } from "@yomikiri/db/client-node";
import { describe, expect, it, vi } from "vitest";
import type { Source } from "../config/sources.js";
import * as upsert from "../db/upsert.js";
import { collectUrls } from "./collectUrls.js";
import * as fetchHtmlModule from "./fetchHtml.js";
import * as robotsModule from "./robots.js";

function buildSource(overrides: Partial<Source> = {}): Source {
  return {
    key: "morning-two",
    name: "モーニング・ツー",
    listUrl: "https://morningtwo.com/series#%E8%AA%AD%E3%81%BF%E5%88%87%E3%82%8A",
    parser: "gigaviewer",
    enabled: true,
    favicon: "/favicons/morning-two.png",
    fallbackSourceKey: "comic-days",
    ...overrides,
  };
}

const MORNING_TWO_HTML = `
<section class="index_page_manga_list_section__eINP4">
<h1 class="index_page_heading__RzE7s" id="読み切り">読み切り</h1>
<div class="index_page_manga_list__6Axwv">
<a href="https://comic-days.com/episode/1?from=morningtwo">作品1</a>
<a href="https://comic-days.com/episode/2?from=morningtwo">作品2</a>
</div>
</section>
`;

describe("collectUrls の fallbackSourceKey 処理", () => {
  it("fallbackSourceKey 先に既存の URL と重複する item を除外してから upsert する", async () => {
    vi.spyOn(robotsModule, "fetchRobotsRules").mockResolvedValue({ isAllowed: () => true });
    vi.spyOn(fetchHtmlModule, "fetchHtml").mockResolvedValue(MORNING_TWO_HTML);
    vi.spyOn(upsert, "getExistingViewerUrlPaths").mockResolvedValue(
      new Set(["https://comic-days.com/episode/1"]),
    );
    const upsertSpy = vi
      .spyOn(upsert, "upsertOneshotUrls")
      .mockResolvedValue({ inserted: 1, updated: 0 });

    const results = await collectUrls({} as Db, [buildSource()]);

    expect(upsert.getExistingViewerUrlPaths).toHaveBeenCalledWith(expect.anything(), "comic-days");
    expect(upsertSpy).toHaveBeenCalledWith(
      expect.anything(),
      "morning-two",
      expect.arrayContaining([
        expect.objectContaining({ viewerUrl: "https://comic-days.com/episode/2?from=morningtwo" }),
      ]),
    );
    expect(upsertSpy.mock.calls[0]?.[2]).toHaveLength(1);
    expect(results[0]).toMatchObject({ sourceKey: "morning-two", fetched: 2, skipped: 1 });
  });

  it("fallbackSourceKey が無い場合は重複判定をスキップする", async () => {
    vi.spyOn(robotsModule, "fetchRobotsRules").mockResolvedValue({ isAllowed: () => true });
    vi.spyOn(fetchHtmlModule, "fetchHtml").mockResolvedValue(MORNING_TWO_HTML);
    const existingSpy = vi.spyOn(upsert, "getExistingViewerUrlPaths");
    vi.spyOn(upsert, "upsertOneshotUrls").mockResolvedValue({ inserted: 2, updated: 0 });

    const results = await collectUrls({} as Db, [buildSource({ fallbackSourceKey: undefined })]);

    expect(existingSpy).not.toHaveBeenCalled();
    expect(results[0]).toMatchObject({ sourceKey: "morning-two", fetched: 2, skipped: 0 });
  });
});

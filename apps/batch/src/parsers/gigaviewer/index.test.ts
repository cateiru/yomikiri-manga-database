import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadSources } from "../../config/sources.js";
import { assertSupportedSources } from "./index.js";

const sourcesPath = fileURLToPath(new URL("../../../../../sources.json", import.meta.url));

describe("assertSupportedSources", () => {
  it("sources.json に定義された全ソースが gigaviewer パーサーに対応している", () => {
    const sources = loadSources(sourcesPath);
    expect(() => assertSupportedSources(sources)).not.toThrow();
  });

  it("未対応の source.key はエラーとして検出する", () => {
    const sources = [
      {
        key: "unknown-source",
        name: "未対応サービス",
        listUrl: "https://example.com/oneshot",
        parser: "gigaviewer" as const,
        enabled: true,
        favicon: "/favicons/unknown-source.png",
      },
    ];
    expect(() => assertSupportedSources(sources)).toThrow(/unknown-source/);
  });
});

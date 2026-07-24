import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadEnabledSources, loadSources } from "./sources.js";

const sourcesPath = fileURLToPath(new URL("../../../../sources.json", import.meta.url));

describe("loadSources", () => {
  it("リポジトリ直下の sources.json を読み込みバリデーションできる", () => {
    const sources = loadSources(sourcesPath);

    expect(sources.length).toBeGreaterThan(0);
    for (const source of sources) {
      expect(source.key.length).toBeGreaterThan(0);
      expect(["gigaviewer", "magapoke", "comic-walker"]).toContain(source.parser);
    }
  });

  it("enabled: true のソースのみを返す", () => {
    const enabled = loadEnabledSources(sourcesPath);

    expect(enabled.length).toBeGreaterThan(0);
    expect(enabled.every((source) => source.enabled)).toBe(true);
  });
});

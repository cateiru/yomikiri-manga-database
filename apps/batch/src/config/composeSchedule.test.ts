import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const composePath = fileURLToPath(new URL("../../../../compose.prod.yaml", import.meta.url));

describe("ofelia の job-local schedule", () => {
  it("mcuadros/ofelia 0.3.x（秒フィールド必須）向けに 6 フィールドで書かれている", () => {
    const compose = readFileSync(composePath, "utf-8");
    const match = compose.match(/ofelia\.job-local\.yomikiri-batch\.schedule:\s*"([^"]+)"/);

    expect(
      match,
      "compose.prod.yaml に yomikiri-batch の schedule label が見つからない",
    ).not.toBeNull();

    const schedule = match?.[1] ?? "";
    const fields = schedule.trim().split(/\s+/);

    // 5 フィールド（分 時 日 月 曜日）で書くと、mcuadros/ofelia 0.3.x（robfig/cron ベース）では
    // 先頭が秒・2番目が分と解釈され、意図しない頻度で実行される事故につながる
    // （本番 VPS で実際に発生。docs/plans/006_デプロイ・運用.md 参照）。
    expect(fields).toHaveLength(6);
  });
});

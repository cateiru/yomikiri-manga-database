import { describe, expect, it } from "vitest";
import { parseRobotsTxt } from "./robots.js";

describe("parseRobotsTxt", () => {
  it("ワイルドカードグループの Disallow を適用する", () => {
    const text = ["User-agent: *", "Disallow: /admin", "Disallow: /private"].join("\n");

    const rules = parseRobotsTxt(text, "yomikiri-manga-database/1.0");

    expect(rules.isAllowed("/oneshot")).toBe(true);
    expect(rules.isAllowed("/admin")).toBe(false);
    expect(rules.isAllowed("/admin/edit")).toBe(false);
    expect(rules.isAllowed("/private")).toBe(false);
  });

  it("固有 UA 向けグループがあればワイルドカードより優先する", () => {
    const text = [
      "User-agent: yomikiri-manga-database",
      "Disallow: /oneshot",
      "",
      "User-agent: *",
      "Disallow: /admin",
    ].join("\n");

    const rules = parseRobotsTxt(text, "yomikiri-manga-database/1.0");

    expect(rules.isAllowed("/oneshot")).toBe(false);
    expect(rules.isAllowed("/admin")).toBe(true);
  });

  it("Disallow が空文字の場合は全許可として扱う", () => {
    const text = ["User-agent: *", "Disallow:"].join("\n");

    const rules = parseRobotsTxt(text, "yomikiri-manga-database/1.0");

    expect(rules.isAllowed("/anything")).toBe(true);
  });
});
